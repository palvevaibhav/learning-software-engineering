const romanNumberValue = (s) => {
    try {
        let total = 0
        let map ={
            'I': 1, 'V': 5, 'X': 10, 'L': 50,
            'C': 100, 'D': 500, 'M': 1000

        }
        for (let i = 0; i < s.length; i++) {
            if(i+1 < s.length && map[s[i]] < map[s[i+1]]){
                total -= map[s[i]]
            }else[
                total +=map[s[i]]
            ]
        }
        console.log(total);
        return total
    } catch (error) {
        console.log(error)
    }
}
romanNumberValue("IIXMXCMI")