import path from "path";

let res = path.join("Base/assets", "css");
console.log(res);
res = path.join("Base/assets/", "/css");
console.log(res);
res = path.join("./Base/assets", "./css");
console.log(res);
