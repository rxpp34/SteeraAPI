const md5 = require("md5");

function hash(key) {
 
     const hash = md5(key);
     return(hash)
  }
   
module.exports={hash}