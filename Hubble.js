const conx=require("./db.config")
const LOG=require("./LOG")
const nodemailer = require("nodemailer");
const handlebars=require("handlebars");
var path=require("path")
var fs=require("fs");





  console.log("====> Hubble System ENABLED")


setInterval(() => {
    conx.query("SELECT * FROM Server",(err,result) => { // ===================> STARTING POINT
        if(err) LOG.Logging(err) 
        Verify(result) ;
        return ; 
    
    })
}, 30000);



function Verify (data) {
    ServerList = data;

    ServerList.forEach((item) => {
        CheckStatus(item)

        conx.query("Select * from Disk Where idsrv=?",item["Badge"],(err,result) => {
            if (err) throw err ; 
            result.forEach((element) => {
                CheckDisk(element,item["Client"])
                IsReady(element,item["Client"]); 
            });
        })
    })

    return ; 
    
}
  



function IsReady(Disk,client) {
    if(Disk["IsReady"]!="True")
    {
        SendAlerte("Disque defectueux",Disk["disk"],Disk["idsrv"],client)
    }

    return ; 
}


function CheckDisk(Disk,client) // Checker le stockage des disque
{

    if(Disk["Total"]-Disk["Useable"] <  ((1/10)*Disk["Total"]))
    {
        SendAlerte("Partition "+Disk["disk"]+" : Espace de stockage inferieur a 10%",Disk["disk"],Disk["idsrv"],client) ;
    }
    
    return ; 
}



function CheckStatus(srv)  //Pour checker si le serveur est présent (>60s le serveur est absent)
{

    // on convertie la date mysql en unix epoch time
    conx.query("SELECT Id FROM Server WHERE MINUTE(TIMEDIFF(NOW(), Horodatage))<5",(err,result) => {
        if(err) {LOG.Logging(err) } 
        else{
            if(Object.keys(result).length==0) {
                SendAlerte("Serveur injoinable ","",srv["Badge"],srv["Client"]) ;
            conx.query("UPDATE Server set NetworkStatus=0 WHERE Badge=?",srv["Badge"],(err,res) => {
                if (err) throw err  ;
            })
            }
        } 
        
    })

    return ; 
}



function SendAlerte(title,Disk,Serveur,client) //Verifie et envoie une alerte à la BDD
{
    conx.query("SELECT * FROM Client WHERE ref=?",client,(err,result) => {
        if (err) throw err  ; 
       const  argu=[title,Disk,Serveur,result[0]["Nom"]]
        conx.query("SELECT * FROM Alertes WHERE Title=?  AND Disk=? and Serveur=? AND Client=? AND state='Pending' AND HOUR(TIMEDIFF(NOW(), Horodatage))<24",argu,(err,result) =>  {
            if (err) throw err ; 
            if(Object.keys(result).length==0) //Si Aucune alerte semblable dans les 24 dernieres heures
            {
                conx.query("INSERT INTO Alertes (Title,Disk,Serveur,Client) VALUES (?,?,?,?)",argu,(err,result) => {
                if (err) throw err  ; 
                SendMail(title,Disk,argu[3],Serveur)
                return ;
                }) 
            }

        })
       
    }) ; 

    return ; 
}


function SendMail(title,disk,client,serveur) { // Pour l'envoie des Alertes Mail
    let transporter = nodemailer.createTransport({ 
      host: "mail.sowilo.info",
      port: 465,
      secure: true, 
      auth: {
        user: "rapport@sowilo.info",
        pass: "%Ch3vreU1l@-(",
      },
    });


        if(disk=="")
        {

            const filePath = path.join(__dirname, './Server.html');
            const source = fs.readFileSync(filePath, 'utf-8').toString();
            const template = handlebars.compile(source);


            const replacements = {
                __Client: client ,
                __Alerte : serveur+" --- "+title
    
            };
    
            const htmlToSend = template(replacements);
        
    
            // send mail with server error 
            let info = transporter.sendMail({
            from: '"AztekServiceManager 👻" <sowilo34@free.fr>', // sender address
            to: "nadjib.ayad@sowilo-network.com", // list of receivers
            subject: "ALERTE", // Subject line
            text: "", // plain text body
            html: htmlToSend, // html body,
            attachments: [{
                filename: 'logo.jpg',
                path: `${__dirname}/Server_out.png`,
                cid: 'Serverout' }]
    
        });
        
        }
        else
        {
            const filePath = path.join(__dirname, './Disk.html');
            const source = fs.readFileSync(filePath, 'utf-8').toString();
            const template = handlebars.compile(source);

            const replacements = {
                __Client: client ,
                __Serveur : serveur,
                __Alerte : title
    
            };
    
            const htmlToSend = template(replacements);
        
    
            // send mail with server error 
            let info = transporter.sendMail({
            from: '"AztekServiceManager 👻" <sowilo34@free.fr>', // sender address
            to: "nadjib.ayad@sowilo-network.com", // list of receivers
            subject: "ALERTE", // Subject line
            text: "Hello world?", // plain text body
            html: htmlToSend, // html body,
            attachments: [{
                filename: 'logo.jpg',
                path: `${__dirname}/Server_out.png`,
                cid: 'Serverout' }]
    
        });

        }
       
    
    

   


  
  }

