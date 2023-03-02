const nodemailer = require("nodemailer");
const handlebars=require("handlebars");
var path=require("path")
var fs=require("fs");


function Send(DocTitle,CuurentMonth) 
{
    let transporter = nodemailer.createTransport({ 
        host: "smtp.free.fr",
        port: 465,
        secure: true, 
        auth: {
          user: "sowilo34@free.fr",
          pass: "#P0n@-+3yRr?",
        },
      });

      
      // send mail with server error 
      transporter.sendMail({
      from: '"SOWILO Network" <sowilo34@free.fr>', // sender address
      to: "nadjib.ayad@sowilo.info", // list of receivers
      subject: "Sowilo Network - Visite Mensuelle Serveur", // Subject line
      text: "", // plain text body
      html: "Bonjour <br><br> Vous trouverez ci-joint la visite mensuelle de votre serveur du "+CuurentMonth+". <br><br>Merci de prêter attention aux éventuels commentaires figurant sur la partie Remarque. <br> <br> Cordialement, <br><br><br> L'équipe Sowilo.", // html body,
      attachments: [{
          filename: DocTitle,
          path: `${__dirname}/VisiteMensuelle/`+DocTitle,
          cid: 'Serverout' }]

    });
}





module.exports={Send} ; 