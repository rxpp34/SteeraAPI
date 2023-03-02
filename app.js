const express=require("express") ; 
const app=express() ;
const fs = require('fs')
const conx=require("./db.config")
const port=1910 ; 
const path = require('path');
var bodyParser = require('body-parser');
const https = require('https');
const vm=require("./CreateVM.js")
const MailVM=require("./SendMailVM")
const Zip=require("./CreateZIP")
const Hash=require("./Hashage_MD5")
const cors = require('cors');
const LOG=require("./LOG")


const options = {
    key: fs.readFileSync( './buro2.mzck.net.key' ),
    cert: fs.readFileSync( './buro2.mzck.net.crt' ),
    requestCert: false,
    rejectUnauthorized: false,
    ca: [
        fs.readFileSync('./rootCA.crt'),
        ]
   
    };



"use strict";


function GetCurrentDate() 
{
    let date_ob = new Date();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    return(month+"-"+year)
}





app.use(cors())
app.use(express.json()) ; 


app.get("/ccs",function(req,res) { 
    res.send({Connection : "ok"})
})



app.post("/GenerateVM/:id_srv/:name_client/:technicien/:remarque/:id_client",function(req,res) { // #######################   API POUR GÉNÉRER UNE VISITE MENSUELLE  #######################

    const tmp=vm.GenerateVM(req.params.name_client,req.params.id_srv,req.params.technicien,req.params.remarque,req.params.id_client)
    let DocTitle = req.params.name_client+"-"+req.params.id_srv+"-"+GetCurrentDate()+".pdf" ;
            MailVM.Send(req.params.name_client+"-"+req.params.id_srv+"-"+GetCurrentDate()+".pdf",GetCurrentDate())
            res.send("OK")
})


app.get("/DownloadTracker/:Client_name/:Server" , function(req,res) {

    conx.query("SELECT * FROM Client WHERE Nom=?",req.params.Client_name,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        Zip.createZipArchive(result[0].ref,req.params.Server)
        res.download("./AztekServiceManager.zip")
    })

})

app.get("/InsertServer/:Client_name/:Server",function(req,res) {

    conx.query("SELECT * FROM Client WHERE Nom=?",req.params.Client_name,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        conx.query("INSERT INTO Server (Badge,Client) VALUES (?,?)",[req.params.Server,result[0].ref],(err,result) => {
            if (err) {
            LOG.Logging(err)
        } ; 
            conx.query("INSERT INTO Disk (idsrv) VALUES (?)",req.params.Server,(err,result) => {
                if (err) {
            LOG.Logging(err)
        } ;
                res.send(result) ; 
            })
        })
    })

})


app.post("/VerifyCredential/:login/:password" , function(req,res) {
    argu=[req.params.login,Hash.hash(req.params.password)]
    conx.query("SELECT * FROM Tech WHERE Login=? and Password=?",argu,(error,result) => {
        if (error) throw error ; 
        if(Object.keys(result).length===0)
        {
            res.send({Authentification : "fail"})
        }
        else
        {
            res.send({Authentification :"ok"})
        }
    })

})

app.get("/GetAllClient",function(req,res) { 
    conx.query("SELECT * FROM Client",(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)
    })
})


app.get("/GetOfflineServer",(req,res) => {
    conx.query("SELECT * FROM Server WHERE NetworkStatus=0",(err,result) => {
        if (err) {
            LOG.Logging(err)
        }  ; 
        res.send(result)
    })
})


app.get("/GetOnlineServer",(req,res) => {
    conx.query("SELECT * FROM Server WHERE NetworkStatus=1",(err,result) => {
        if (err) {
            LOG.Logging(err)
        }  ; 
        res.send(result)
    })
})


app.get("/GetPendingAlerte",(req,res) => {
    conx.query("SELECT * FROM Alertes where State='Pending' ORDER BY horodatage",(err,result) => {
        if (err) {
            LOG.Logging(err)
        }  ;
       res.send(result)
    })
})

app.post("/DoneAlerte/:id", (req,res) => {
    conx.query("UPDATE Alertes SET State='Done' WHERE Id=?",req.params.id,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})


app.get("/GetClientById/:id", (req,res) => {
    conx.query("SELECT * FROM Client WHERE ref=?",req.params.id,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})

app.get("/GetClient", (req,res) => {
    conx.query("SELECT * FROM Client  ORDER by Nom",req.params.id,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})



app.get("/GetServerStatus/:server", (req,res) => {
    conx.query("SELECT Id FROM Server WHERE Badge=? AND MINUTE(TIMEDIFF(NOW(), Horodatage))<=5",req.params.server,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        if(Object.keys(result).length===0)
        {
            res.send({status: "Offline"})
        }
        else
        {
            res.send({status: "Connected"})
        }

    })
})

app.get("/GetServerByBadge/:badge", (req,res) => {
    conx.query("SELECT * FROM Server WHERE Badge=?",req.params.badge,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})

app.get("/GetServerByClientName/:client_name", (req,res) => {
    if(req.params.client_name==="-- Clients --")
    {
        conx.query("SELECT * FROM Server",(err,result3) => {
            if (err) {
            LOG.Logging(err)
        } ; 
            res.send(result3)
        })
    }
    else
    {
        conx.query("SELECT ref FROM Client WHERE Nom=?",req.params.client_name,(err,result) => {
            if (err) {
            LOG.Logging(err)
        } ; 
            result.map((item) => {
                conx.query("SELECT * FROM Server WHERE Client=?",item.ref,(err,result2) => {
                    if (err) {
            LOG.Logging(err)
        } ; 
                    res.send(result2)
                })
            })
    
        })
    }
    
})

app.get("/GetAllServer", (req,res) => {
    conx.query("SELECT * FROM Server",(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})


app.post("/SearchAlerteForDiskByServer/:server/:client", (req,res) => {
    const argu=[req.params.server,req.params.client]
    conx.query("SELECT * FROM Alerte Serveur=? AND Client=? AND Disk!='' AND State='Pending'",argu,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})


app.get("/GetMailByClient/:client", (req,res) => {
    conx.query("SELECT * FROM Mail WHERE Idclient=?",req.params.client,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})




app.post("/AddNewClient/:nom/:adresse/:telephone/:email1/:email2", (req,res) => {
    
    conx.query("SELECT ref FROM Client ORDER BY ref DESC LIMIT 1",(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        const argu=[result[0]["ref"]+1,req.params.nom,req.params.adresse,req.params.telephone]
        conx.query("insert into Client (ref,Nom,Referant,Telephone) VALUES (?,?,?,?)",argu,(err,result2) => {
            if (err) {
            LOG.Logging(err)
        } ; 
            conx.query("insert into Mail (Idclient,email) VALUES (?,?)",[result[0]["ref"]+1,req.params.email1],(err,result3) => {
                if (err) {
            LOG.Logging(err)
        } ; 

                if(req.params.email2==="null")
                {
                    res.send(result)
                }
                else
                {
                    conx.query("insert into Mail (Idclient,email) VALUES (?,?)",[result[0]["ref"]+1,req.params.email2],(err,result3) => {
                        if (err) {
            LOG.Logging(err)
        } ; 
                        res.send(result)
                    })
                }
                
            })


        })
    })

    return
})


app.post("/UpdateClient/:client_id/:client_name/:referant/:telephone/:ref1/:mail1/:ref2/:mail2", (req,res) => {
    const argu=[req.params.client_name,req.params.referant,req.params.telephone,req.params.client_id]
    conx.query("UPDATE Client SET Nom=? , Referant=?, Telephone=? WHERE ref=?",argu,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        const argu=[req.params.mail1,req.params.ref1]
        conx.query("UPDATE Mail set email=? WHERE ref=?",argu,(err,result) => {
            if (err) {
            LOG.Logging(err)
        } ;
            if(req.params.mail2!="null" && req.params.ref2==="null")
            {   
                const argu=[req.params.client_id,req.params.mail2]
                conx.query("INSERT INTO Mail (IdClient,email) VALUES (?,?)",argu,(err,result) => {
                    if (err) {
            LOG.Logging(err)
        } ; 
                    res.send(result)
                })
            }
            else if(req.params.mail2!="null" && req.params.ref2!="null")
            {
                const argu=[req.params.mail2,req.params.ref2]
                conx.query("UPDATE Mail set email=? WHERE ref=?",argu,(err,result) => {
                    if (err) {
            LOG.Logging(err)
        } ; 
                    res.send(result)
                })
            }
            else if(req.params.mail2==="null" && req.params.ref2!="null")
            {
                conx.query("DELETE FROM Mail WHERE ref=?",req.params.ref2,(err,result) => {
                    if (err) {
            LOG.Logging(err)
        } ; 
                    res.send(result)
                })
            }
            else
            {
                res.send(result)
            }

        })

    })
})


app.get("/GetFicheClient/:id_client", (req,res) => {
    conx.query("SELECT FicheClient FROM Client WHERE ref=?",req.params.id_client,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result[0].FicheClient)

    })
})


app.post("/UpdateFicheClient/:id_client/:ficheclient", (req,res) => {
    conx.query("UPDATE Client SET FicheClient=? WHERE ref=?",[req.params.ficheclient,req.params.id_client],(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})


app.get("/GetDiskByServer/:badge", (req,res) => {
    conx.query("SELECT * FROM Disk where idsrv=?",req.params.badge,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})

app.get("/GetVisiteMensuelleByServer/:server", (req,res) => {
    conx.query("SELECT * FROM Visite_mensuelle where Serveur=?",req.params.server,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send(result)

    })
})


app.post("/UpdatePassword/:user/:password" ,(req,res) => {
    const new_password=Hash.hash(req.params.password)
    conx.query("UPDATE Tech set Password=?",new_password,(err,result) => {
        if (err) {
            LOG.Logging(err)
        }  ; 
        res.send(result)
    })
})

// ==================================================================================================
//                                        CSharp API
// ==================================================================================================
app.get("/CheckExistingServer/:badge",(req,res) => {
    conx.query("SELECT * FROM Server WHERE Badge=?",req.params.badge,(err,result) => {
        if(err) throw err ;
        if(Object.keys(result).length>0)
        {
            res.send("EXIST")
        }
        else
        {
            res.send("NOEXIST")
        }
    })
})

app.post("/InsertData/:hostname/:osversion/:networkstatus/:ram/:cpu/:maj/:client/:ippublic/:ipprive/:badge/:type",(req,res) => {
    argu=[req.params.badge,req.params.hostname,req.params.osversion,req.params.networkstatus,req.params.ram,req.params.cpu,req.params.maj,req.params.client,req.params.ippublic,req.params.ipprive,req.params.type]
    conx.query("INSERT INTO Server (Badge,Hostname,Osversion,NetworkStatus,Ram,Cpu,Maj,Client,Ip_public,Ip_prive,Type) VALUES (?,?,?,?,?,?,?,?,?,?,'Windows')", argu , (err,result) => {
        res.send("OK") ; 
    })
})


app.post("/UpdateData/:hostname/:osversion/:networkstatus/:ram/:cpu/:maj/:client/:ippublic/:ipprive/:badge",(req,res) => {
    argu=[req.params.hostname,req.params.osversion,req.params.networkstatus,req.params.ram,req.params.cpu,req.params.maj,req.params.client,req.params.ippublic,req.params.ipprive,req.params.badge]
    conx.query("UPDATE Server SET Hostname=?, Osversion=?,NetworkStatus=?,Ram=?,Cpu=?,Maj=?,Client=?,Ip_public=?,Ip_prive=? WHERE Badge=?", argu , (err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send("OK") ; 
    })
})

app.post("/DeleteAllPartition/:badge",(req,res) => {
    conx.query("DELETE FROM Disk WHERE idsrv=?",req.params.badge,(err,result) => {
        if (err) {
            LOG.Logging(err)
        } ; 
        res.send("OK")
    })
})

app.post("/InsertPartition/:badge/:disk/:useable/:total/:isready",(req,res) => {
    const argu =[req.params.badge,req.params.disk,req.params.useable,req.params.total,req.params.isready]
    conx.query("INSERT INTO Disk (idsrv,disk,Useable,Total,IsReady) VALUES (?,?,?,?,?)",argu,(err,result) => {
        if (err) {
            LOG.Logging(err)
        }
        res.send("OK")
        
    })
})

// ==================================================================================================
//                                        CSharp API
// ==================================================================================================
//app.listen(port , console.log("====> Server Listening on "+port))



https.createServer(options, app).listen(port, () => {
    console.log('====> Server is running on port',port);
  });


