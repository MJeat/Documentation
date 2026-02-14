const express = require('express');
const mysql = require('mysql2');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// =============================
// CONFIG
// =============================

const BUCKET = "company-storage-network-project";

const s3 = new S3Client({
    region: "us-east-1"
    // No credentials here — using IAM Role (correct production practice)
});

const db = mysql.createConnection({
    host: 'company-db.c2lqwc4e8qkg.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'CompanyNetwork123',
    database: 'companyDBTest'
});

db.connect(err => {
    if (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
    console.log("✅ Database connected");
});

app.use(express.json());

// Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// =============================
// ROUTES
// =============================

// GET FILES (Search)
app.get('/api/files', (req, res) => {
                                                           
