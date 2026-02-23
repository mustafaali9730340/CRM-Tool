# 🎓 BEGINNER'S GUIDE - Immigration CRM System

## What Did Node.js Install?

When you ran `npm install`, Node.js downloaded several "packages" (like apps/tools) to help your CRM work. Here's what each one does in simple terms:

### 📦 Packages Installed:

1. **express** - Makes it easy to create a web server (like the engine that runs your CRM)
2. **cors** - Allows your website and CRM to talk to each other safely
3. **bcryptjs** - Scrambles passwords so hackers can't read them
4. **jsonwebtoken** - Creates secure "login tickets" for users
5. **sqlite3** - A simple database (like an Excel file but smarter) to store all your data

### 📁 Folders Created:

- **node_modules/** - This folder contains all the packages above (you can ignore this!)
- **package-lock.json** - Keeps track of package versions (you can ignore this too!)

---

## 🚀 SIMPLE SETUP STEPS

### Step 1: Install Node.js (One-Time Only)
If you haven't already:
1. Go to https://nodejs.org
2. Download the "LTS" version (recommended)
3. Install it like any other program
4. That's it! ✅

### Step 2: Open Terminal/Command Prompt
**On Windows:**
- Press `Windows Key + R`
- Type `cmd` and press Enter

**On Mac:**
- Press `Command + Space`
- Type `terminal` and press Enter

### Step 3: Navigate to Your CRM Folder
In the terminal, type:
```bash
cd path/to/your/crm/folder
```

Example:
```bash
cd C:\Users\YourName\Desktop\immigration-crm
```

### Step 4: Install Packages (One-Time Only)
```bash
npm install
```

This downloads all the packages. It takes 1-2 minutes. You only do this once!

### Step 5: Start Your CRM
```bash
npm start
```

You should see:
```
Immigration CRM Server running on port 3000
API available at http://localhost:3000/api
```

### Step 6: Open Your Browser
Go to: **http://localhost:3000**

You'll see the login page! 🎉

---

## 📝 DAILY USE

Every time you want to use your CRM:

1. Open terminal/command prompt
2. Go to your CRM folder: `cd path/to/crm/folder`
3. Type: `npm start`
4. Open browser: `http://localhost:3000`

To stop the server:
- Press `Ctrl + C` in the terminal

---

## 🗂️ YOUR FILES EXPLAINED

Here's what each file does:

### **server.js** 
The "brain" of your CRM. This file:
- Handles user logins
- Saves/loads data from the database
- Processes all requests (like "add a client" or "update a case")

### **package.json**
A simple list telling Node.js what packages to install. Like a shopping list.

### **public/index.html**
The CRM interface that users see and interact with. This is the "face" of your CRM.

### **immigration_crm.db** (created automatically)
Your database file - where all your data is stored (clients, cases, tasks, etc.)

### **.env.example**
A template for storing secret settings (like passwords for your database)

---

## ❓ COMMON QUESTIONS

### Q: Do I need to keep the terminal open?
**A:** Yes! While you're using the CRM, keep the terminal window open. The CRM stops working if you close it.

### Q: Can other people use it at the same time?
**A:** Yes! Multiple people can login from different computers if they can access your computer's network.

### Q: Where is my data stored?
**A:** In the `immigration_crm.db` file. **IMPORTANT:** Backup this file regularly!

### Q: Can I use this on my phone?
**A:** Yes! If your computer and phone are on the same WiFi, you can access it from your phone's browser.

### Q: What if I close the terminal by accident?
**A:** No problem! Your data is saved. Just run `npm start` again.

---

## 🔧 TROUBLESHOOTING

### Error: "npm is not recognized"
**Solution:** Node.js isn't installed properly. Reinstall Node.js from nodejs.org

### Error: "Port 3000 is already in use"
**Solution:** The CRM is already running! Check if you have another terminal window open.
Or change the port in the `.env` file.

### Error: "Cannot find module"
**Solution:** Run `npm install` again in your CRM folder.

### The website won't load
**Solution:** 
1. Make sure the terminal shows "Server running on port 3000"
2. Try: http://127.0.0.1:3000 instead of localhost
3. Check if your firewall is blocking port 3000

---

## 🌐 CONNECTING TO YOUR WEBSITE

### Option 1: Simple Link (Easiest)
Add a link on your website:
```html
<a href="http://your-crm-address:3000">Staff Portal</a>
```

### Option 2: Iframe (Embed in Page)
Add this to your website's HTML:
```html
<iframe src="http://your-crm-address:3000" 
        width="100%" 
        height="800px" 
        frameborder="0">
</iframe>
```

### Option 3: Professional Setup (Hire a Developer)
For production use, you'll want:
- A proper domain (crm.yourfirm.com)
- HTTPS security certificate
- Cloud hosting (so it works 24/7)
- Professional database backup

---

## 💾 BACKING UP YOUR DATA

**VERY IMPORTANT:** Regularly backup your `immigration_crm.db` file!

**Easy backup method:**
1. Find the `immigration_crm.db` file in your CRM folder
2. Copy it to a safe location (USB drive, Google Drive, etc.)
3. Rename it with the date: `immigration_crm_2024_02_15.db`

Do this weekly or daily depending on how much you use the CRM!

---

## 📞 GETTING HELP

If you're stuck:
1. Read the error message in the terminal
2. Google the error message
3. Check the README.md file for technical details
4. Consider hiring a developer for professional setup

---

## 🎯 QUICK START CHECKLIST

- [ ] Install Node.js
- [ ] Download all CRM files to a folder
- [ ] Open terminal and go to that folder
- [ ] Run `npm install` (one time only)
- [ ] Run `npm start`
- [ ] Open http://localhost:3000 in browser
- [ ] Register first user account
- [ ] Start adding clients!

---

## 🔐 SECURITY TIPS

1. **Use strong passwords** for user accounts
2. **Change the JWT_SECRET** in the .env file (make it a long random string)
3. **Don't share your database file** with unauthorized people
4. **Backup regularly** - your data is important!
5. **For internet access** - hire a professional to set up proper security

---

## 📚 NEXT STEPS

Once you're comfortable:
1. Customize case types to match your firm's needs
2. Add more document types
3. Invite your staff to register accounts
4. Set up regular database backups
5. Consider professional hosting for 24/7 access

---

Remember: This CRM is like a computer program that runs on YOUR computer. It's not automatically "on the internet" - it only works while your computer is running the server (with `npm start`).

For professional deployment where it works 24/7 from anywhere, you'll need to host it on a cloud server (like AWS, DigitalOcean, or Heroku). That's a more advanced setup!
