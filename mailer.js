// mailer.js
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD, // App password or real password (if less secure apps allowed)
  },
});

app.post("/send-otp", async (req, res) => {
  const { email, name } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  console.log(`Sending OTP to: ${email} for ${name}`); // Debug log
  console.log(`Generated OTP: ${otp}`); // Debug log

  const mailOptions = {
    from: '"RecruitHub" <hebagassem911@gmail.com>',
    to: email,
    subject: "Your OTP Verification Code",
    text: `Dear ${name},\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis code is valid for a short time. Please do not share it with anyone.\n\nBest regards,\nRecruitHub Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to: ${email}`); // Debug log
    res.json({ success: true, otp }); // Send back the OTP
  } catch (err) {
    console.error("Failed to send mail:", err);
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
});

app.post("/send-verification-email", async (req, res) => {
  const { email, name } = req.body;

  const mailOptions = {
    from: '"RecruitHub" <hebagassem911@gmail.com>',
    to: email,
    subject: "Your Company Has Been Verified",
    text: `Dear ${name},\n\nCongratulations! Your company account has been successfully verified.\n\nYou can now log in and access all the platform features without restrictions.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nRecruitHub Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to: ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send verification email:", err);
    res
      .status(500)
      .json({ success: false, message: "Verification email failed" });
  }
});

app.post("/send-password-reset", async (req, res) => {
  const { email, name, resetUrl } = req.body;

  const mailOptions = {
    from: '"RecruitHub" <hebagassem911@gmail.com>',
    to: email,
    subject: "Password Reset Request",
    text: `Dear ${name},\n\nYou requested a password reset.\n\nPlease click the link below to reset your password:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nRecruitHub Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to: ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    res
      .status(500)
      .json({ success: false, message: "Password reset email failed" });
  }
});

app.post("/send-bulk-email", async (req, res) => {
  const { applications, status_text, fail } = req.body;
  const emailErrors = [];
  // console.log(applications.length);
  // console.log(status_text);
  // console.log(fail);
  for (const app of applications) {
    const user_name = app.user_name;
    const user_email = app.user_email;
    const job = app.job_title;
    const company_name = app.company_name;
    const company_email = app.company_email;

    let subject;
    let message;

    if (fail) {
      subject = `Application Update for ${job} at ${company_name}`;
      message =
        `Dear ${user_name},\n\n` +
        `We regret to inform you that your application for ${job} at ${company_name} ` +
        `has not passed the current stage.\n\n` +
        `Best regards,\n${company_name} Team\n` + 
        `${company_email}`;
    } else {
      subject = `Application Update for ${job} at ${company_name}`;
      message =
        `Dear ${user_name},\n\n` +
        `Your application for ${job} at ${company_name} ` +
        `has moved to the next stage: ${status_text}.\n\n` +
        `Best regards,\n${company_name} Team\n` + 
        `${company_email}`;
    }

    const sender = `"${company_name} HR Team" <${company_email}>`;
    console.log(message);
    try {
      await transporter.sendMail({
        from: sender,
        to: user_email,
        subject,
        text: message,
      });
    } catch (err) {
      console.error(`Failed to send email to ${user.email}: ${err}`);
      emailErrors.push(user.email);
    }
  }
  // console.log("bulk email", applications.length);
  res.json({ success: true, emailErrors });
});

app.post("/send-schedule-email", async (req, res) => {
  const {
    user_email,
    user_name,
    company_name,
    company_email,
    link,
    time,
    phase,
  } = req.body;

  const mailOptions = {
    from: `"${company_name} HR Team" <${company_email}>`,
    to: user_email,
    subject: `Interview Schedule Confirmation`,
    text: `Dear ${user_name},\n\nWe are pleased to confirm your interview with ${company_name}.\n\nDetails are as follows:\n\nLink: ${link}\nTime: ${time}\nPhase: ${phase}\n\nPlease do not hesitate to reach out if you have any questions.\n\nBest regards,\n${company_name} HR Team\n${company_email}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Schedule email sent successfully to: ${user_email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send schedule email:", err);
    res.status(500).json({ success: false, message: "Schedule email failed" });
  }
});

app.post("/send_recommendation", async (req, res) => {
  const { emails, job_title, job_link, company_name } = req.body;
  console.log(emails, job_title, job_link);
  const mailOptions = {
    from: '"RecruitHub" <hebagassem911@gmail.com>',
    to: emails.join(","),
    subject: `Job Recommendation: ${job_title}`,
    text: `Dear Itians,\n\nWe think you might be interested in the following job opportunity:\n\n${job_title} at ${company_name}\n\nPlease find more information and apply here: ${job_link}\n\nBest regards,\nRecruitHub Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send recommendation email:", err);
    res.status(500).json({ success: false, message: "Recommendation email failed" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Mailer server running on port ${PORT}`));
