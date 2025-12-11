/**
 * @param {string[]} strs
 * @return {string}
 */
var longestCommonPrefix = function (strs) {
    if (!strs.length) return "";
    let n = strs.length;
    for (let i = 0; i < strs[0].length; i++) {
        const char = strs[0][i]
        for (let j = 1; j < strs.length; j++) {
            if (i >= strs[j].length || strs[j][i] != char) {
                console.log(strs[0].slice(0, i))
                return strs[0].slice(0, i)
            }
        }        
    }
    return strs[0]

};

longestCommonPrefix(["flower","flow","flight"])