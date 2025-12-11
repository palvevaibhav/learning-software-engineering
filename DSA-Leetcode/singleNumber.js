function findSingleNumber(arr) {
    let res = 0;
    for (const n of arr) {
        res ^= n
        console.log(res)
    }
    return res
}

let array = [32, 32, 42]
findSingleNumber(array)