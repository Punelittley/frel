const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
app.use(express.json({ limit: '10mb' }));


db.serialize(() => {

    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, description TEXT, price INTEGER,
        category TEXT, category_label TEXT, skills TEXT,
        offers INTEGER, author TEXT, author_avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`ALTER TABLE projects ADD COLUMN author TEXT`, () => {});
    db.run(`ALTER TABLE projects ADD COLUMN author_avatar_url TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS kworks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, price INTEGER, seller_name TEXT,
        seller_rating REAL, category TEXT, image_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, author TEXT, image_url TEXT,
        category TEXT, likes INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, specialty TEXT, bio TEXT,
        rating REAL, reviews_count INTEGER, avatar_seed TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS guides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT, description TEXT, icon TEXT, target TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL, last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, phone TEXT, role TEXT,
        specialty TEXT, skills TEXT, experience TEXT,
        city TEXT, bio TEXT, portfolio_url TEXT, telegram TEXT,
        min_budget INTEGER DEFAULT 0, avatar_url TEXT,
        rating REAL DEFAULT 5.0, reviews_count INTEGER DEFAULT 0,
        orders_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`ALTER TABLE accounts ADD COLUMN avatar_url TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kwork_id INTEGER, kwork_title TEXT, price INTEGER,
        seller_name TEXT, buyer_id INTEGER, buyer_name TEXT,
        status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER, sender_name TEXT,
        recipient_name TEXT, text TEXT, type TEXT DEFAULT 'sent',
        bot_name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO users (name, specialty, bio, rating, reviews_count, avatar_seed) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run("ArtDesign", "Графический дизайнер", "Создаю логотипы, которые работают на ваш бизнес. Опыт 5 лет.", 4.9, 124, "ArtDesign");
            stmt.run("WebMaster", "Fullstack разработчик", "Специализируюсь на WordPress и React. Делаю быстро и чисто.", 5.0, 89, "WebMaster");
            stmt.run("SEO_Pro", "SEO специалист", "Вывожу сайты в топ Яндекса и Google. Только белые методы.", 4.7, 245, "SEO_Pro");
            stmt.run("CopyWriter", "Копирайтер", "Пишу тексты, которые продают. От постов в соцсети до лонгридов.", 4.8, 156, "CopyWriter");
            stmt.run("SMM_King", "Маркетолог", "Знаю всё о трафике из соцсетей. Привлекаю клиентов, а не просто лайки.", 4.6, 78, "SMM_King");
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM kworks", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO kworks (title, price, seller_name, seller_rating, category, image_url) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run("Профессиональный логотип за 24 часа", 1500, "ArtDesign", 4.9, "design", "img/logotip.jpg");
            stmt.run("Установка и настройка WordPress", 2000, "WebMaster", 5.0, "dev", "img/word.webp");
            stmt.run("1000 качественных обратных ссылок", 3500, "SEO_Pro", 4.7, "seo", "img/ssilka.webp");
            stmt.run("Напишу 3 продающих текста", 1000, "CopyWriter", 4.8, "texts", "img/tekst.jpg");
            stmt.run("Баннер для соцсетей (VK, Inst)", 500, "SMM_King", 4.6, "design", "img/banne.png");
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO projects (title, description, price, category, category_label, skills, offers, author, author_avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            stmt.run("Разработка landing page для IT-стартапа", "Нужен современный лендинг с анимациями. Figma-макет предоставлю.", 15000, "dev", "Разработка", '["HTML/CSS","JavaScript","React"]', 12, "aleksei_dev", "img/1.png");
            stmt.run("Дизайн логотипа и фирменного стиля", "Для нового бренда одежды нужен логотип, визитки, паттерн.", 8000, "design", "Дизайн", '["Illustrator","Branding","Figma"]', 24, "marina_design", "img/2.webp");
            stmt.run("SEO-продвижение интернет-магазина", "Магазин электроники на WordPress. Нужно вывести 50 запросов в топ-10.", 25000, "seo", "SEO", '["SEO","Аналитика","Контент"]', 8, "ivan_seo", "img/3.png");
            stmt.run("Написать 10 статей для блога", "Тематика — здоровое питание. SEO-оптимизация, уникальность от 95%.", 5000, "texts", "Тексты", '["Копирайтинг","SEO","Редактура"]', 31, "olga_texts", "img/4.png");
            stmt.run("Настройка таргетированной рекламы VK", "Бюджет 30 000₽/мес. Тематика — услуги для бизнеса.", 10000, "ads", "Реклама", '["VK Ads","Аналитика","A/B тесты"]', 15, "dmitry_ads", "img/5.png");
            stmt.run("Мобильное приложение для доставки еды", "React Native, iOS + Android. Есть backend API.", 80000, "dev", "Разработка", '["React Native","TypeScript","REST API"]', 6, "elena_dev", "img/6.png");
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM portfolio", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO portfolio (title, author, image_url, category, likes) VALUES (?, ?, ?, ?, ?)`);
            stmt.run("Ребрендинг кофейни «Бариста»", "ArtDesign", "img/rediz.jpg", "Дизайн", 234);
            stmt.run("Лендинг для SaaS-продукта", "WebMaster", "img/lending.webp", "Разработка", 189);
            stmt.run("SEO-кейс: рост трафика x5", "SEO_Pro", "img/seo.png", "SEO", 312);
            stmt.run("Серия иллюстраций для бренда", "ArtDesign", "img/desighn.jpg", "Дизайн", 156);
            stmt.run("Корпоративный сайт юрфирмы", "WebMaster", "img/sait.webp", "Разработка", 98);
            stmt.run("Контент-стратегия для блога", "CopyWriter", "img/kontent.png", "Тексты", 145);
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM guides", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare(`INSERT INTO guides (title, description, icon, target) VALUES (?, ?, ?, ?)`);
            stmt.run("Как создать проект", "Перейдите на биржу, нажмите 'Создать проект' и опишите вашу задачу.", "fa-plus-circle", "buyer");
            stmt.run("Выбор лучшего отклика", "Изучайте профили, портфолио и отзывы исполнителей перед наймом.", "fa-user-check", "buyer");
            stmt.run("Безопасная сделка", "Ваши деньги хранятся в системе и переводятся только после принятия работы.", "fa-shield-alt", "buyer");
            stmt.run("Как откликнуться", "Найдите подходящий заказ на бирже и предложите свою цену и сроки.", "fa-paper-plane", "seller");
            stmt.run("Создание кворка", "Оформите свои услуги в виде кворков, чтобы заказчики находили вас сами.", "fa-briefcase", "seller");
            stmt.run("Вывод средств", "Заработанные деньги можно вывести на карту или электронный кошелек за 24 часа.", "fa-wallet", "seller");
            stmt.finalize();
        }
    });

    const testHash = crypto.createHash('sha256').update('qweqwe').digest('hex');
    db.get("SELECT COUNT(*) as count FROM accounts WHERE email = 'qwe@gmail.com'", (err, row) => {
        if (row && row.count === 0) {
            db.run(
                `INSERT INTO accounts (first_name, last_name, username, email, password_hash, role, specialty, skills, experience, city, bio, telegram, min_budget, avatar_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                ['Test', 'User', 'testuser', 'qwe@gmail.com', testHash, 'seller', 'design', '["Figma","Photoshop","Illustrator"]', '1-3', 'Москва', 'Тестовый пользователь для проверки функционала.', '@testuser', 1000, 'img/avatar-testuser.png']
            );
        }
    });

});


app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/projects/:id', (req, res) => {
    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

app.get('/api/kworks', (req, res) => {
    const { category } = req.query;
    if (category) {
        db.all("SELECT * FROM kworks WHERE category = ?", [category], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        db.all("SELECT * FROM kworks", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/projects-portfolio', (req, res) => {
    db.all("SELECT * FROM portfolio", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/guides', (req, res) => {
    db.all("SELECT * FROM guides", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/register', (req, res) => {
    const { first_name, last_name, username, email, password, phone, role, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget, avatar_url } = req.body;
if (!first_name || !username || !email || !password) {
    return res.json({ success: false, message: 'Заполните все обязательные поля' });
}
    if (password.length < 6) return res.json({ success: false, message: 'Пароль минимум 6 символов' });
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return res.json({ success: false, message: 'Некорректное имя пользователя' });

    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    db.run(
        `INSERT INTO accounts (first_name, last_name, username, email, password_hash, phone, role, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget, avatar_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [first_name, last_name, username, email, password_hash, phone, role, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget || 0, avatar_url || null],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.json({ success: false, message: 'Email или username уже заняты' });
                return res.json({ success: false, message: 'Ошибка сервера' });
            }
            const user = { id: this.lastID, first_name, last_name, username, email, phone, role, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget, avatar_url };
            res.json({ success: true, user });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Введите email и пароль' });
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    db.get('SELECT * FROM accounts WHERE email = ? AND password_hash = ?', [email, password_hash], (err, row) => {
        if (err) return res.json({ success: false, message: 'Ошибка сервера' });
        if (!row) return res.json({ success: false, message: 'Неверный email или пароль' });
        const { password_hash: _, ...user } = row;
        res.json({ success: true, user });
    });
});

app.get('/api/profile/:username', (req, res) => {
    db.get(
        `SELECT id, first_name, last_name, username, email, phone, role, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget, avatar_url, rating, reviews_count, orders_count, created_at FROM accounts WHERE username = ?`,
        [req.params.username], (err, row) => {
            if (err || !row) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json(row);
        }
    );
});

app.put('/api/profile/:username', (req, res) => {
    const { first_name, last_name, phone, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget, avatar_url } = req.body;
    db.run(
        `UPDATE accounts SET first_name=?, last_name=?, phone=?, specialty=?, skills=?, experience=?, city=?, bio=?, portfolio_url=?, telegram=?, min_budget=?, avatar_url=? WHERE username=?`,
        [first_name, last_name, phone, specialty, skills, experience, city, bio, portfolio_url, telegram, min_budget || 0, avatar_url || null, req.params.username],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json({ success: true });
        }
    );
});

app.get('/api/kworks/:seller', (req, res) => {
    db.all("SELECT * FROM kworks WHERE seller_name = ?", [req.params.seller], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/portfolio/:author', (req, res) => {
    db.all("SELECT * FROM portfolio WHERE author = ?", [req.params.author], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/projects', (req, res) => {
    const { title, category, description, price, deadline, skills, user_id, client_name, author, author_avatar_url } = req.body;
    if (!title || !category || !description || !price) return res.status(400).json({ error: 'Заполните все обязательные поля' });
    const categoryLabels = { dev: 'Разработка', design: 'Дизайн', seo: 'SEO', texts: 'Тексты', ads: 'Реклама' };
    db.run(
        `INSERT INTO projects (title, description, price, category, category_label, skills, offers, author, author_avatar_url) VALUES (?,?,?,?,?,?,0,?,?)`,
        [title, description, price, category, categoryLabels[category] || category, skills || '[]', author || client_name || 'Аноним', author_avatar_url || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.post('/api/orders', (req, res) => {
    const { kwork_id, kwork_title, price, seller_name, buyer_id, buyer_name } = req.body;
    if (!kwork_id || !seller_name || !buyer_id) return res.status(400).json({ error: 'Недостаточно данных' });
    db.run(
        `INSERT INTO orders (kwork_id, kwork_title, price, seller_name, buyer_id, buyer_name) VALUES (?,?,?,?,?,?)`,
        [kwork_id, kwork_title, price, seller_name, buyer_id, buyer_name],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.get('/api/messages/:userId', (req, res) => {
    db.all("SELECT * FROM messages WHERE sender_id = ? OR recipient_name = ? ORDER BY created_at ASC",
        [req.params.userId, req.params.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

app.post('/api/messages', (req, res) => {
    const { sender_id, sender_name, recipient_name, text, type, bot_name } = req.body;
    db.run(
        `INSERT INTO messages (sender_id, sender_name, recipient_name, text, type, bot_name) VALUES (?,?,?,?,?,?)`,
        [sender_id, sender_name, recipient_name, text, type || 'sent', bot_name || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.get('/api/admin/accounts', (req, res) => {
    db.all("SELECT id, first_name, last_name, username, email, role, created_at FROM accounts ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.delete('/api/admin/accounts/:id', (req, res) => {
    db.run("DELETE FROM accounts WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/projects/:id', (req, res) => {
    db.run("DELETE FROM projects WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/kworks/:id', (req, res) => {
    db.run("DELETE FROM kworks WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/admin/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
