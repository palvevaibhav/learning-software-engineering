let array = [5, 4, 7, 3, 6];

let min = Infinity;
let sec = Infinity;
for (const n of array) {
    if (n < min) {
        sec = min;
        min = n;
        console.log(sec, n)
    }
    else if (n < sec && n != min) {
        console.log(sec, n)
        sec = n
    }
}
console.log(sec, min)