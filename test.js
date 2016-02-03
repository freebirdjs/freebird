var x = {
    y: 1,
    z: null,
    m: undefined
};
x[3] = 6;

console.log(x);
console.log(x.hasOwnProperty(3));
console.log('m' in x);
