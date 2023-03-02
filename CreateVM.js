const PDFGenerator = require('pdfkit')
const fs = require('fs')
const conx=require("./db.config");
const { exit, exitCode } = require('process');
var msg="OK !"


function GetCurrentDate() 
{
    let date_ob = new Date();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    return(month+"-"+year)
}



function GenerateVM (ClientName,ServerBadge,Technicien,Remarque,ClientID) 
{
   
    conx.query("SELECT * FROM Disk WHERE idsrv=?",ServerBadge,(err,result) => {
        
        if(err) 
        {
            throw err ;
        }
        else
        {
            var theOutput = new PDFGenerator 
            let DocTitle = ClientName+"-"+ServerBadge+"-"+GetCurrentDate()+".pdf" ;

            var nbr_partition=0 ; 
            var nbr_disk_hs=0 ; 
            const page_begin=370 ;

            // ############################################## SECTION 1 ############################################## 
            theOutput.pipe(fs.createWriteStream('./VisiteMensuelle/'+DocTitle))
            theOutput.image('./TOP12.png',170,5 ,{width :"250"}).fontSize(28)
            theOutput.text("Visite Mensuelle",210,120,{fontSize : '35'}).fontSize(15)

            theOutput.moveTo(50,200).lineTo(550,200).stroke()

            theOutput.text("Date : ",70,220)
            theOutput.text("Client : ",70,250)
            theOutput.text("Technicien : ",70,280)
            theOutput.text("Serveur : ",70,310)

            theOutput.text(GetCurrentDate(),310,220)
            theOutput.text(ClientName,310,250)
            theOutput.text(Technicien,310,280)
            theOutput.text(ServerBadge,310,310)

            // ############################################## SECTION 2 ############################################## 
            theOutput.moveTo(50,340).lineTo(550,340).stroke()

    
            result.map((item) => {
                if(item.IsReady==="False")
                {
                    nbr_disk_hs+=1
                }
            })

    
            theOutput.text("État des disque : ",70, 370)
            if(nbr_disk_hs>0)
            {
                theOutput.text("Dégradé",190, 370)
            }
            else
            {
                theOutput.text("OK",190, 370)
            }
    
            theOutput.text("Nombre disques HS: ",300, 370)
            theOutput.text(nbr_disk_hs,450, 370)
    
            result.map((item,index) => {
                theOutput.fontSize(12)
                theOutput.text("Partition "+item.disk,70,page_begin+((index+1)*30))
                if(item.IsReady==="False")
                {
                    theOutput.fillColor("red")
                    theOutput.text(" Dégradé",145,page_begin+((index+1)*30))
                }
                else
                {
                    theOutput.fillColor("green")
                    theOutput.text(" OK",145,page_begin+((index+1)*30))
                }
                
    
                theOutput.fontSize(12)
                theOutput.fillColor("black")
                theOutput.text("Capacité totale ",220,page_begin+((index+1)*30))
                theOutput.text(item.Useable+" Go",310,page_begin+((index+1)*30))
    
                theOutput.fontSize(12)
                theOutput.text("Capacité restante ",390,page_begin+((index+1)*30))
                theOutput.text(item.Total-item.Useable+" Go",500,page_begin+((index+1)*30))
               
    
                nbr_partition+=1  
            })
            

            theOutput.moveTo(50,(nbr_partition+1)*30+page_begin).lineTo(550,(nbr_partition+1)*30+page_begin).stroke()
            
            theOutput.fontSize(14)
            theOutput.text("Remarque :",70,(nbr_partition+2)*30+page_begin)
            theOutput.text(Remarque,150,(nbr_partition+3)*30+page_begin)

            // ############################################## FOOTER ############################################## 
            theOutput.fontSize(8)
            theOutput.text("SOWILO-Network Clermont - SAS au capital de 10 000 euros",200,690)
            theOutput.text("Immatriculé au RCS Montpellier 814 524 039",235,700)
            theOutput.text("N° TVA : FR24814524039",260,710)
        
            theOutput.end()

            conx.query("INSERT INTO Visite_mensuelle (Client,Serveur,Technicien,Datage,Remarque) VALUES (?,?,?,?,?)",[ClientID,ServerBadge,Technicien,GetCurrentDate(),Remarque],(err,result) => {
                if (err) throw err ;
            })
           
           
        }
        
        
        
     })
     return(null)
}

module.exports={GenerateVM }