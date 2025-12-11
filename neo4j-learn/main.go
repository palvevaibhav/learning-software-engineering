package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// PatchVersion model
type PatchVersion struct {
	PatchID       int64  `json:"patch_id"`
	Component     string `json:"component"`
	MajorVersion  int    `json:"major_version"`
	MinorVersion  int    `json:"minor_version"`
	PatchVersion  int    `json:"patch_version"`
	VersionString string `json:"version_string"`
	Status        string `json:"status"`
	PreRelease    string `json:"pre_release,omitempty"`
	BuildMetadata string `json:"build_metadata,omitempty"`
	PatchNumber   int    `json:"patch_number,omitempty"`
	ReleaseDate   string `json:"release_date,omitempty"`
	SupersedesID  int64  `json:"supersedes_id,omitempty"`
	ReleaseNotes  string `json:"release_notes,omitempty"`
	Checksum      string `json:"checksum,omitempty"`
}

var preReleaseOrder = []string{"alpha", "beta", "delta", "rc"}

//  Generate checksum based on unique patch content
func GenerateChecksum(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

// Handler struct holds Neo4j driver
type Handler struct {
	Neo4jDriver neo4j.DriverWithContext
}

// Helper: JSON Response
func jsonResponse(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

var semverRegex = regexp.MustCompile(`^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)*$`)

func validateSemver(version string) bool {
	return semverRegex.MatchString(version)
}

func generateVersionString(p PatchVersion) string {
	base := fmt.Sprintf("%d.%d.%d", p.MajorVersion, p.MinorVersion, p.PatchVersion)

	if p.PreRelease != "" {
		base += "-" + p.PreRelease
	}

	buildMeta := ""
	if p.BuildMetadata != "" {
		buildMeta = "+" + p.BuildMetadata
	}
	if p.Checksum != "" {
		if buildMeta != "" {
			buildMeta += "+" + p.Checksum
		} else {
			buildMeta = "+" + p.Checksum
		}
	}

	return base + buildMeta
}


func getNextVersion(ctx context.Context, session neo4j.SessionWithContext, component string) (major, minor, patch int, err error) {
	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		query := `
			MATCH (p:PatchVersion {component: $component})
			RETURN p.major_version AS major, p.minor_version AS minor, p.patch_version AS patch
			ORDER BY major DESC, minor DESC, patch DESC
			LIMIT 1`
		records, err := tx.Run(ctx, query, map[string]any{"component": component})
		if err != nil {
			return nil, err
		}
		if records.Next(ctx) {
			rec := records.Record()
			return map[string]int{
				"major": int(rec.Values[0].(int64)),
				"minor": int(rec.Values[1].(int64)),
				"patch": int(rec.Values[2].(int64)),
			}, nil
		}
		return nil, nil
	})
	if err != nil {
		return 0, 0, 0, err
	}

	if result == nil {
		return 1, 0, 0, nil // first release
	}

	v := result.(map[string]int)
	return v["major"], v["minor"], v["patch"] + 1, nil
}

//  POST /patch-version
func (h *Handler) CreatePatchVersion(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var patches []PatchVersion
	if err := json.NewDecoder(r.Body).Decode(&patches); err != nil {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON payload"})
		return
	}

	if len(patches) == 0 {
		jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "empty patch array"})
		return
	}

	session := h.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	var created []PatchVersion

	for _, p := range patches {
		if p.Component == "" || p.Status == "" {
			continue
		}

		//  If user didn’t supply version numbers → auto-generate next patch version
		if p.MajorVersion == 0 && p.MinorVersion == 0 && p.PatchVersion == 0 {
			major, minor, patchVersion, err := getNextVersion(ctx, session, p.Component)
			if err != nil {
				log.Printf(" Error determining version for %s: %v\n", p.Component, err)
				continue
			}
			p.MajorVersion = major
			p.MinorVersion = minor
			p.PatchVersion = patchVersion
		}

		//  Generate checksum based on stable identifying info
		checksumInput := fmt.Sprintf("%s:%d.%d.%d:%s:%s",
			p.Component, p.MajorVersion, p.MinorVersion, p.PatchVersion, p.Status, p.ReleaseNotes)
		p.Checksum = GenerateChecksum(checksumInput)

		//  Generate version string (with pre-release, build metadata, checksum)
		versionParts := fmt.Sprintf("%d.%d.%d", p.MajorVersion, p.MinorVersion, p.PatchVersion)
		if p.PreRelease != "" {
			versionParts += "-" + p.PreRelease
		}
		if p.BuildMetadata != "" {
			versionParts += "+" + p.BuildMetadata
		}
		// append first 8 chars of checksum for readability
		versionParts += "+" + p.Checksum[:8]
		p.VersionString = versionParts

		if !validateSemver(p.VersionString) {
			log.Printf("⚠️ Invalid semver: %s\n", p.VersionString)
			continue
		}

		//  Ensure uniqueness per (component, version_string)
		exists, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
			result, err := tx.Run(ctx,
				`MATCH (pv:PatchVersion {component:$component, version_string:$version})
				 RETURN COUNT(pv) AS cnt`,
				map[string]any{"component": p.Component, "version": p.VersionString})
			if err != nil {
				return false, err
			}
			if result.Next(ctx) {
				cnt, _ := result.Record().Values[0].(int64)
				return cnt > 0, nil
			}
			return false, nil
		})
		if err != nil {
			log.Printf(" Database read error: %v\n", err)
			continue
		}
		if exists.(bool) {
			log.Printf("⚠️ Duplicate version %s for component %s — skipping\n", p.VersionString, p.Component)
			continue
		}

		//  Create Neo4j node
		_, err = session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
			_, err := tx.Run(ctx,
				`CREATE (p:PatchVersion {
					patch_id:$patch_id,
					component:$component,
					major_version:$major_version,
					minor_version:$minor_version,
					patch_version:$patch_version,
					version_string:$version_string,
					status:$status,
					pre_release:$pre_release,
					build_metadata:$build_metadata,
					release_notes:$release_notes,
					checksum:$checksum
				}) RETURN p`,
				map[string]any{
					"patch_id":       p.PatchID,
					"component":      p.Component,
					"major_version":  p.MajorVersion,
					"minor_version":  p.MinorVersion,
					"patch_version":  p.PatchVersion,
					"version_string": p.VersionString,
					"status":         p.Status,
					"pre_release":    p.PreRelease,
					"build_metadata": p.BuildMetadata,
					"release_notes":  p.ReleaseNotes,
					"checksum":       p.Checksum,
				},
			)
			return nil, err
		})
		if err != nil {
			log.Printf(" Write error for %s: %v\n", p.Component, err)
			continue
		}

		log.Printf(" Created version %s for %s\n", p.VersionString, p.Component)
		created = append(created, p)
	}

	if len(created) == 0 {
		jsonResponse(w, http.StatusConflict, map[string]string{"error": "no patches created"})
		return
	}

	jsonResponse(w, http.StatusCreated, map[string]any{"created": created})
}

//  GET /patch-version
func (h *Handler) ListPatchVersions(w http.ResponseWriter, r *http.Request) {
	component := r.URL.Query().Get("component")
	status := r.URL.Query().Get("status")

	ctx := context.Background()
	session := h.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	query := `MATCH (p:PatchVersion) WHERE 1=1`
	params := map[string]any{}

	if component != "" {
		query += " AND p.component = $component"
		params["component"] = component
	}
	if status != "" {
		query += " AND p.status = $status"
		params["status"] = status
	}
	query += " RETURN p"

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		records, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}

		var patches []PatchVersion
		for records.Next(ctx) {
			node := records.Record().Values[0].(neo4j.Node)
			props := node.Props
			p := PatchVersion{
				PatchID:       props["patch_id"].(int64),
				Component:     props["component"].(string),
				VersionString: props["version_string"].(string),
				Status:        props["status"].(string),
			}
			if val, ok := props["checksum"].(string); ok {
				p.Checksum = val
			}
			patches = append(patches, p)
		}
		return patches, nil
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Neo4j read error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(result)
}

//  PUT /patch-version/{patch_id}
func (h *Handler) UpdatePatchVersion(w http.ResponseWriter, r *http.Request) {
	patchID := chi.URLParam(r, "patch_id")

	var p PatchVersion
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	session := h.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(ctx,
			`MATCH (pv:PatchVersion {patch_id: $patch_id})
			 SET pv.status = $status,
			     pv.release_notes = $release_notes
			 RETURN pv`,
			map[string]any{
				"patch_id":      patchID,
				"status":        p.Status,
				"release_notes": p.ReleaseNotes,
			},
		)
		return nil, err
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Neo4j update error: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(p)
}

//  DELETE /patch-version/{patch_id}
func (h *Handler) DeletePatchVersion(w http.ResponseWriter, r *http.Request) {
	patchIDStr := chi.URLParam(r, "patch_id")

	var patchID int64
	_, err := fmt.Sscan(patchIDStr, &patchID)
	if err != nil {
		http.Error(w, "Invalid patch_id format", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	session := h.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	deletedCount, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		result, err := tx.Run(ctx,
			`MATCH (p:PatchVersion {patch_id: $patch_id})
			 WITH COUNT(p) AS cnt, COLLECT(p) AS nodes
			 FOREACH (n IN nodes | DETACH DELETE n)
			 RETURN cnt`,
			map[string]any{"patch_id": patchID},
		)
		if err != nil {
			return nil, err
		}
		if !result.Next(ctx) {
			return int64(0), nil
		}
		cnt, _ := result.Record().Values[0].(int64)
		return cnt, nil
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Neo4j delete error: %v", err), http.StatusInternalServerError)
		return
	}

	count := deletedCount.(int64)
	if count == 0 {
		http.Error(w, fmt.Sprintf("PatchVersion %d not found", patchID), http.StatusNotFound)
		return
	}

	fmt.Fprintf(w, " PatchVersion %d deleted successfully", patchID)
}
func (h *Handler) DeleteAllData(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	session := h.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	deletedCount, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		// Delete all nodes and relationships
		result, err := tx.Run(ctx, `
			MATCH (n)
			WITH COUNT(n) AS count, COLLECT(n) AS nodes
			FOREACH (n IN nodes | DETACH DELETE n)
			RETURN count
		`, nil)
		if err != nil {
			return nil, err
		}
		if result.Next(ctx) {
			count, _ := result.Record().Values[0].(int64)
			return count, nil
		}
		return int64(0), nil
	})
	if err != nil {
		http.Error(w, fmt.Sprintf(" Failed to delete data: %v", err), http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, map[string]any{
		"message":       " All data deleted successfully",
		"nodes_deleted": deletedCount,
	})
}


// MAIN
func main() {
	fmt.Println("🚀 Starting Neo4j PatchVersion API server...")

	driver, err := neo4j.NewDriverWithContext(
		"neo4j://localhost:7687",
		neo4j.BasicAuth("neo4j", "password", ""),
	)
	if err != nil {
		log.Fatalf(" Failed to create Neo4j driver: %v", err)
	}
	defer driver.Close(context.Background())

	fmt.Println(" Connected to Neo4j successfully!")

	handler := &Handler{Neo4jDriver: driver}

	r := chi.NewRouter()
	r.Get("/patch-version", handler.ListPatchVersions)
	r.Post("/patch-version", handler.CreatePatchVersion)
	r.Put("/patch-version/{patch_id}", handler.UpdatePatchVersion)
	r.Delete("/patch-version/{patch_id}", handler.DeletePatchVersion)
	r.Delete("/delete-all", handler.DeleteAllData)


	fmt.Println("🌐 Server running at http://localhost:8080")
	http.ListenAndServe(":8080", r)
}
