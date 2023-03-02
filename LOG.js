const fs = require('fs');

function Logging(content) 
{
    let date_ob = new Date();
    fs.writeFile('./log/aztek.log', "\n "+date_ob+"====> "+content, { flag: 'a' }, err => {
        if (err) { console.log(err)}
    });
}


module.exports={Logging}