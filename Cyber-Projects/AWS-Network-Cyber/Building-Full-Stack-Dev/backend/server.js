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
    const search = req.query.search || '';
    const sql = `
        SELECT id, filename, s3_url, upload_date 
        FROM uploads 
        WHERE filename LIKE ?
        ORDER BY upload_date DESC
    `;

    db.query(sql, [`%${search}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// UPLOAD FILE
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const username = "AdminUser";

    try {
        const key = Date.now() + "-" + file.originalname;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));

        const s3Url = `https://${BUCKET}.s3.amazonaws.com/${key}`;

        const sql = `
            INSERT INTO uploads (filename, s3_url)
            VALUES (?, ?, ?)
        `;

        db.query(sql, [username, file.originalname, s3Url], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: "Upload successful" });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE FILE
app.delete('/api/files/:id', (req, res) => {
    const id = req.params.id;

    const sql = "SELECT s3_url FROM uploads WHERE id = ?";

    db.query(sql, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0)
            return res.status(404).json({ error: "File not found" });

        const s3Url = results[0].s3_url;
        const key = s3Url.split('.com/')[1];

        try {
            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: key
            }));

            db.query("DELETE FROM uploads WHERE id = ?", [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Deleted successfully" });
            });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
});

// =============================

app.listen(3000, '0.0.0.0', () => {
    console.log("✅ API running on port 3000");
});
