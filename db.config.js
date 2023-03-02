const mysql=require("mysql")
const LOG=require("./LOG")

const conx=mysql.createConnection({
    host : '192.168.5.161', 
    user : "Admin",
    password :"%Pucelle6969",
    database : "Aztek",
    dateStrings: true
}) ; 



conx.connect((error) => {
    if (error) {LOG.Logging(error)} else {
        console.log("====> Database Connected.")
    }
    
})



module.exports=conx ;
