const nodemailer = require("nodemailer");

const sendMail = async (email,otp) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'dinesh@gmail.com',
          pass: 'izykktxgvyjuwvzl'
        }
      });
      
      var mailOptions = {
        from: 'dinesh@gmail.com',
        to: email,
        subject:' otp,plzz dont share it to anyone  ',
        text: otp
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
};

const  generateOtp = () => {
  let otp = '';
  for (let i = 0; i < 6; i++) {
      otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

module.exports = {sendMail,generateOtp}
