// mailer.js
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();
const pdf = require("pdfkit");
const fs = require("fs");
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const { consumeQueue } = require('./queue_consumer');

// Setup transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD, // App password or real password (if less secure apps allowed)
  },
});

app.post("/send-otp", async (req, res) => {
  const { email, name, otp } = req.body;
  // const otp = Math.floor(100000 + Math.random() * 900000);

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
    res
      .status(500)
      .json({ success: false, message: "Recommendation email failed" });
  }
});

app.post("/send-contract", async (req, res) => {
  const {
    user_email,
    user_name,
    job_title,
    job_attendance,
    job_type,
    company_name,
    company_email,
    salary,
    insurance,
    termination,
  } = req.body;

  let mailOptions;

  const doc = new pdf();
  const stream = doc.pipe(fs.createWriteStream(`${user_name} contract.pdf`));

  // Header
  doc.fontSize(30).font("Helvetica-Bold").text(`${company_name}`, {
    align: "center",
  });
  doc.moveDown(0.5);
  doc
    .fontSize(18)
    .font("Helvetica")
    .text("Employment Contract", { align: "center" });
  doc.moveDown(1);

  // Intro / Company Environment
  doc
    .fontSize(12)
    .text(
      `We are pleased to offer you a position at ${company_name}, a company known for innovation, inclusivity, and fostering professional growth. Our team thrives in a collaborative environment with modern tools, flexible work policies, and a commitment to employee well-being.`,
      {
        align: "justify",
        indent: 20,
        lineGap: 6,
        paragraphGap: 10,
        width: 450,
      }
    );

  // Contract Details
  doc.moveDown(1);
  doc.fontSize(14).font("Helvetica-Bold").text("Contract Details:");
  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(12);
  doc.text(`Job Title: ${job_title}`);
  doc.text(`Attendance: ${job_attendance}`);
  doc.text(`Type: ${job_type}`);
  doc.text(`Salary: ${salary}`);
  doc.text(`Insurance Coverage: ${insurance}`);
  doc.text(
    `Termination Clause: ${
      termination === "0 months"
        ? "N/A"
        : termination +
          " (" +
          parseInt(termination.split(" ")[0]) *
            parseInt(salary.split(" ")[0].replace(/,/g, "")) +
          " " +
          salary.split(" ")[1] +
          ")"
    }`
  );
  
  doc.moveDown(1);
  doc.fontSize(14).font("Helvetica-Bold").text("Terms and Legal Agreements:");
  
  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      `By signing this contract, you agree to the following terms and conditions:`
    )
    .moveDown(0.1)
    .text(
      `1- This agreement is governed by and construed in accordance with the laws of Egypt.`
    )
    .moveDown(0.1)
    .text(
      `2- This agreement constitutes the entire agreement between the parties and supersedes all prior or contemporaneous agreements or understandings, whether written or oral.`
    )
    .moveDown(0.1)
    .text(
      `3- This agreement may not be amended or modified except in writing signed by both parties.`
    )
    .moveDown(0.1)
    .text(
      `4- Confidentiality: The applicant acknowledges that all information shared during the interview process, including but not limited to the company's business operations, financial data, marketing strategies, and any other sensitive information, is confidential and shall not be disclosed to any third party.`
    )
    .moveDown(0.1)
    .text(
      `5- Non-Compete: The employee agrees not to work for any company that competes with ${company_name} or engage in any business activity that may be detrimental to the company's interests during the term of employment and for a period of six months after termination of employment.`
    );

  // Signatures
  doc.moveDown(1);
  doc.font("Helvetica-Bold").text("Signatures", { underline: true });

  const signatureY = doc.y + 20; // Add spacing from previous content

  doc
    .font("Helvetica")
    .text("__________________________", 100, signatureY)
    .text("Applicant Signature", 100, signatureY + 15)
    .text("__________________________", 350, signatureY)
    .text("Company Representative", 350, signatureY + 15);

  doc.end();

  stream.on("finish", async () => {
    mailOptions = {
      from: `"${company_name} HR Team" <${company_email}>`,
      to: user_email,
      subject: `Job Contract: ${job_title}`,
      text: `Dear ${user_name},\n\nPlease find the job contract for ${job_title} at ${company_name} attached.\n\nPlease sign and return one copy to us by email.\n\nBest regards,\n${company_name} HR Team\n${company_email}`,
      attachments: [
        {
          filename: `${user_name} contract.pdf`,
          path: `${user_name} contract.pdf`,
          contentType: "application/pdf",
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      fs.unlinkSync(`${user_name} contract.pdf`);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to send contract email:", err);
      res
        .status(500)
        .json({ success: false, message: "Contract email failed" });
    }
  });
});

app.post('/send-report', async (req, res) => {
  const data = req.body;
  const filename = `report-${Date.now()}.pdf`;

  try {
    // 1. Generate PDF
    const doc = new pdf();
    const pdfPath = `./${filename}`;
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(16).text('Interview Analysis Report', { align: 'center' });
    doc.moveDown();

    const scores = [
      ['Answer Relevance', data.answer_score],
      ['Pronunciation', data.pronunciation_score],
      ['Grammar', data.grammar_score],
      ['Professional Attire', data.attire_score],
      ['Total Score', data.total_score]
    ];

    doc.fontSize(12).text('Scores Summary:');
    scores.forEach(([label, score]) => {
      doc.text(`${label}: ${score}/10`);
    });

    doc.moveDown().text(`Question: ${data.question}`);
    doc.moveDown().text(`Your Answer: ${data.user_answer}`);
    // doc.moveDown().text(`Ideal Answer: ${data.ideal_answer}`);
    doc.moveDown().text(`Feedback: ${data.feedback || 'N/A'}`);

    doc.end();

    // Wait for PDF to finish writing
    await new Promise(resolve => stream.on('finish', resolve));

    // 2. Send Email
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hebagassem911@gmail.com',
        pass: 'smue mdmk uoov zctr' // Use app password
      }
    });

    let mailOptions = {
      from: '"Recruitment Team" <hebagassem911@gmail.com>',
      to: data.email,
      subject: 'Your Interview Analysis Report',
      text: `Dear Applicant,\n\nPlease find attached your interview report.\n\nBest,\nRecruitment Team`,
      html: `
        <p>Dear Applicant,</p>
        <p>Here is your interview analysis report:</p>
        <p><strong>Question:</strong> ${data.question}</p>
        <p><strong>Your Answer:</strong> ${data.user_answer}</p>
        <p><strong>Ideal Answer:</strong> ${data.ideal_answer}</p>
        <p><strong>Feedback:</strong> ${data.feedback}</p>
        <p><strong>Formality Feedback:</strong> ${data.attire_feedback}</p>
        <p>Best regards,<br>Recruitment Team</p>
      `,
      attachments: [{
        filename: 'Interview_Report.pdf',
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);

    // Delete the temporary PDF
    fs.unlinkSync(pdfPath);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send report:', err);
    res.status(500).json({ error: 'Failed to generate and send report' });
  }
});



// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Mailer server running on port ${PORT}`));


async function startConsumers() {
  console.log('Starting listener for email_queue');
  await consumeQueue('email_queue');
}

startConsumers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});