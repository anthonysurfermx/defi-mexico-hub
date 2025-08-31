# 🔗 Supabase Database Queries Setup

## ⚠️ Environment Setup Required

The database queries cannot run because your Supabase credentials are not configured. Here's how to set them up:

### 1. **Update Environment Variables**

Edit your `.env.` file and replace the placeholder values:

```bash
# Current (placeholder values):
VITE_SUPABASE_URL=tu-proyecto-url.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Replace with your real values:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 2. **Get Your Supabase Credentials**

1. **Go to:** [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project:** `defi-mexico-hub` or your project name
3. **Go to Settings** → **API**
4. **Copy:**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. **Run the Database Queries**

Once you've updated the environment variables:

```bash
# Run the database exploration script
node db-queries.mjs
```

## 📊 **What the Script Will Show:**

### **1. List All Accessible Tables**
- Discovers which tables exist and are accessible
- Shows record counts for each table

### **2. Communities Table Structure**
- Column names and data types
- Sample data examples
- Total record count

### **3. Other Important Tables**
- `blog_posts` - Your blog content
- `startups` - Startup data
- `events` - Event information
- `users`/`profiles` - User data

## 🔧 **Manual SQL Queries (Alternative)**

If you prefer to run the queries directly in Supabase:

### **1. List All Tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **2. Communities Table Structure:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'communities'
ORDER BY ordinal_position;
```

### **3. Count Communities:**
```sql
SELECT COUNT(*) FROM communities;
```

## 🎯 **Expected Results:**

Based on your project structure, you should see tables like:
- ✅ `blog_posts` - Working (we've used this)
- ❓ `communities` - May not exist yet
- ❓ `startups` - May not exist yet  
- ❓ `events` - May not exist yet

## 🚀 **Next Steps:**

1. **Update credentials** in `.env.`
2. **Run** `node db-queries.mjs`
3. **Review results** to understand your database structure
4. **Create missing tables** if needed based on your mock data

---

**⚡ Ready to explore your Supabase database!**