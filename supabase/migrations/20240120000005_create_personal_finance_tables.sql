-- Migration to create personal finance tables for user dashboard
-- Run this to enable personal finance functionality

-- Create transaction categories table
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES transaction_categories(id),
    category_name TEXT, -- Fallback for custom categories
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    tags TEXT[], -- Array of tags
    notes TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT, -- monthly, weekly, yearly, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial goals table
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline DATE,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES transaction_categories(id),
    category_name TEXT, -- Fallback for custom categories
    monthly_limit DECIMAL(12,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    spent_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);

CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_status ON financial_goals(status);
CREATE INDEX idx_financial_goals_deadline ON financial_goals(deadline);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);

-- Enable RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON transactions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions" ON transactions
FOR DELETE USING (user_id = auth.uid());

-- RLS policies for financial goals
CREATE POLICY "Users can view own goals" ON financial_goals
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals" ON financial_goals
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals" ON financial_goals
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals" ON financial_goals
FOR DELETE USING (user_id = auth.uid());

-- RLS policies for budgets
CREATE POLICY "Users can view own budgets" ON budgets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own budgets" ON budgets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets" ON budgets
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets" ON budgets
FOR DELETE USING (user_id = auth.uid());

-- RLS policies for transaction categories (public read, admin write)
CREATE POLICY "Anyone can view categories" ON transaction_categories
FOR SELECT USING (true);

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at 
    BEFORE UPDATE ON financial_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default transaction categories
INSERT INTO transaction_categories (name, type, icon, color) VALUES
-- Income categories
('Salary', 'income', '💼', '#10b981'),
('Freelance', 'income', '🔧', '#10b981'),
('Investment', 'income', '📈', '#10b981'),
('Business', 'income', '🏢', '#10b981'),
('Other Income', 'income', '💰', '#10b981'),

-- Expense categories
('Food & Dining', 'expense', '🍽️', '#ef4444'),
('Transportation', 'expense', '🚗', '#ef4444'),
('Shopping', 'expense', '🛍️', '#ef4444'),
('Entertainment', 'expense', '🎬', '#ef4444'),
('Bills & Utilities', 'expense', '💡', '#ef4444'),
('Healthcare', 'expense', '🏥', '#ef4444'),
('Education', 'expense', '📚', '#ef4444'),
('Travel', 'expense', '✈️', '#ef4444'),
('Groceries', 'expense', '🛒', '#ef4444'),
('Housing', 'expense', '🏠', '#ef4444'),
('Insurance', 'expense', '🛡️', '#ef4444'),
('Personal Care', 'expense', '💅', '#ef4444'),
('Gifts & Donations', 'expense', '🎁', '#ef4444'),
('Technology', 'expense', '💻', '#ef4444'),
('Other Expense', 'expense', '📊', '#ef4444'); 