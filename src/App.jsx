import { Moon, Sun } from 'lucide-react';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

// =============================================================================
// utils/ExternalScripts.jsx
// =============================================================================
const ExternalScripts = () => (
    <>
        <script src="https://unpkg.com/xlsx/dist/xlsx.full.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
    </>
);

// =============================================================================
// utils/exportUtils.js
// =============================================================================
const exportToCsv = (data, filename, currency) => {
    const header = ["Date", "Type", "Category", "Description", "Amount"];
    const rows = data.map(t => [
        t.date,
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        t.category,
        t.description,
        `${currency}${t.amount.toFixed(2)}`
    ]);

    let csvContent = header.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const exportToExcel = (data, filename) => {
    if (typeof window.XLSX === 'undefined') {
        console.error("SheetJS (XLSX) library not loaded.");
        return;
    }

    const ws_data = [
        ["Date", "Type", "Category", "Description", "Amount"],
        ...data.map(t => [
            t.date,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            t.category,
            t.description,
            t.amount
        ])
    ];
    const ws = window.XLSX.utils.aoa_to_sheet(ws_data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    window.XLSX.writeFile(wb, filename);
};

const exportToPdf = (data, filename, currency) => {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        console.error("jsPDF library not loaded.");
        return;
    }
    if (typeof window.jspdf.autoTable === 'undefined') {
        console.error("jspdf-autotable plugin not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const tableColumn = ["Date", "Type", "Category", "Description", "Amount"];
    const tableRows = [];

    data.forEach(t => {
        const transactionData = [
            t.date,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            t.category,
            t.description,
            `${currency}${t.amount.toFixed(2)}`,
        ];
        tableRows.push(transactionData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    const date = new Date().toLocaleDateString();
    doc.text(`Financial Transactions - ${date}`, 14, 15);
    doc.save(filename);
};

// =============================================================================
// LocalStorageContext.jsx
// =============================================================================
const LocalStorageContext = createContext(null);
const useLocalStorageData = () => useContext(LocalStorageContext);

// =============================================================================
// AuthContext.jsx
// =============================================================================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// =============================================================================
// components/TransactionList.jsx
// =============================================================================
const TransactionList = ({ transactions }) => {
    const { settings } = useLocalStorageData();
    const { currency } = settings;

    if (transactions.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet. Add some to get started!</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">Date</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{transaction.date}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    transaction.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }`}>
                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{transaction.category}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{transaction.description || '-'}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                                <span className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {transaction.type === 'income' ? '+' : '-'}{currency}{transaction.amount.toFixed(2)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// =============================================================================
// components/charts/CategorySpendingChart.jsx
// =============================================================================
const CategorySpendingChart = ({ transactions }) => {
    const { settings } = useLocalStorageData();
    const { currency } = settings;
    // Filter for expenses in the current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyExpenses = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
    });

    // Aggregate spending by category
    const categoryData = monthlyExpenses.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
    }, {});

    const chartData = Object.keys(categoryData).map(category => ({
        name: category,
        value: categoryData[category]
    }));

    // Define a set of appealing colors for the pie chart
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc0cb', '#da70d6', '#808080', '#4169e1'];

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-center h-96">
                <p className="text-gray-500 dark:text-gray-400">No expenses recorded for this month to display in pie chart.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-96 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Spending by Category (This Month)</h2>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// =============================================================================
// components/charts/MonthlySpendingChart.jsx
// =============================================================================
const MonthlySpendingChart = ({ transactions }) => {
    const { settings } = useLocalStorageData();
    const { currency } = settings;
    // Aggregate expenses by month
    const monthlyData = transactions.filter(t => t.type === 'expense').reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        acc[monthYear] = (acc[monthYear] || 0) + transaction.amount;
        return acc;
    }, {});

    // Convert to array and sort by month
    const chartData = Object.keys(monthlyData).map(monthYear => ({
        month: monthYear,
        spending: monthlyData[monthYear]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-center h-96">
                <p className="text-gray-500 dark:text-gray-400">No expenses recorded to display monthly spending chart.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-96 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Spending Trend</h2>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="spending" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>

            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">Monthly Spending Bar Chart</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${currency}${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="spending" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// =============================================================================
// components/modals/AddTransactionModal.jsx
// =============================================================================
const AddTransactionModal = ({ onClose }) => {
    const { transactions, setTransactions, settings } = useLocalStorageData();
    const { currency } = settings;
    const [type, setType] = useState('expense'); // 'expense' or 'income'
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); //YYYY-MM-DD
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const expenseCategories = ['Food', 'Transport', 'Utilities', 'Rent', 'Shopping', 'Entertainment', 'Health', 'Education', 'Other Expense'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (!category) {
            setError('Please select a category.');
            return;
        }
        if (!date) {
            setError('Please select a date.');
            return;
        }

        try {
            const newTransaction = {
                id: Date.now(), // Simple unique ID for local storage
                type,
                category,
                amount: parseFloat(amount),
                date,
                description,
                timestamp: new Date().toISOString() // For ordering
            };
            setTransactions(prevTransactions => [newTransaction, ...prevTransactions]); // Add new transaction to the top
            onClose(); // Close modal on success
        } catch (err) {
            console.error("Error adding transaction:", err);
            setError("Failed to add transaction. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg relative my-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Add New Transaction</h2>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl dark:text-gray-400 dark:hover:text-gray-200"
                >
                    &times;
                </button>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Type</label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-green-600 dark:text-green-500"
                                    name="type"
                                    value="income"
                                    checked={type === 'income'}
                                    onChange={() => setType('income')}
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Income</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-red-600 dark:text-red-500"
                                    name="type"
                                    value="expense"
                                    checked={type === 'expense'}
                                    onChange={() => setType('expense')}
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Expense</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Category</label>
                        <select
                            id="category"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="">Select a category</option>
                            {type === 'expense' ? (
                                expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            ) : (
                                incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            )}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Amount ({currency})</label>
                        <input
                            type="number"
                            id="amount"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Date</label>
                        <input
                            type="date"
                            id="date"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Description (Optional)</label>
                        <textarea
                            id="description"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                    >
                        Add Transaction
                    </button>
                </form>
            </div>
        </div>
    );
};

// =============================================================================
// components/modals/SetBudgetModal.jsx
// =============================================================================
const SetBudgetModal = ({ onClose, currentBudget }) => {
    const { budgets, setBudgets, settings } = useLocalStorageData();
    const { currency } = settings;
    const [budgetAmount, setBudgetAmount] = useState(currentBudget > 0 ? currentBudget.toString() : '');
    const [monthYear, setMonthYear] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!budgetAmount || isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) < 0) {
            setError('Please enter a valid non-negative budget amount.');
            return;
        }

        try {
            const newBudget = {
                monthYear: monthYear,
                budgetAmount: parseFloat(budgetAmount)
            };

            // Find if budget for this month already exists
            const existingBudgetIndex = budgets.findIndex(b => b.monthYear === monthYear);

            if (existingBudgetIndex !== -1) {
                // Update existing budget
                const updatedBudgets = [...budgets];
                updatedBudgets[existingBudgetIndex] = newBudget;
                setBudgets(updatedBudgets);
            } else {
                // Add new budget
                setBudgets(prevBudgets => [...prevBudgets, newBudget]);
            }
            onClose();
        } catch (err) {
            console.error("Error setting budget:", err);
            setError("Failed to set budget. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative my-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Set Monthly Budget</h2>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl dark:text-gray-400 dark:hover:text-gray-200"
                >
                    &times;
                </button>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="monthYear" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Month and Year</label>
                        <input
                            type="month"
                            id="monthYear"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={monthYear}
                            onChange={(e) => setMonthYear(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="budgetAmount" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Budget Amount ({currency})</label>
                        <input
                            type="number"
                            id="budgetAmount"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                    >
                        Save Budget
                    </button>
                </form>
            </div>
        </div>
    );
};

// =============================================================================
// components/modals/ExportModal.jsx
// =============================================================================
const ExportModal = ({ transactions, currency, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm relative my-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Export Transactions</h2>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl dark:text-gray-400 dark:hover:text-gray-200"
                >
                    &times;
                </button>
                <div className="space-y-4">
                    <button
                        onClick={() => { exportToCsv(transactions, 'transactions.csv', currency); onClose(); }}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// pages/DashboardPage.jsx
// =============================================================================
const DashboardPage = () => {
    const { transactions, budgets, settings } = useLocalStorageData();
    const [currentMonthBudget, setCurrentMonthBudget] = useState(0);
    const { currency } = settings;

    // Update current month's budget whenever budgets change
    useEffect(() => {
        const today = new Date();
        const currentMonthYear = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        const budgetForCurrentMonth = budgets.find(b => b.monthYear === currentMonthYear);
        setCurrentMonthBudget(budgetForCurrentMonth ? budgetForCurrentMonth.budgetAmount : 0);
    }, [budgets]);

    // Calculate total spending for the current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const currentMonthSpending = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' &&
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const remainingBudget = currentMonthBudget - currentMonthSpending;
    const budgetProgress = currentMonthBudget > 0 ? (currentMonthSpending / currentMonthBudget) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Overview Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Budget Overview</h2>
                        <p className="text-lg text-white mb-2">Budget for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currency}{currentMonthBudget.toFixed(2)}</span></p>
                        <p className="text-lg text-white mb-2">Current Spending: <span className="font-bold text-red-500 dark:text-red-400">{currency}{currentMonthSpending.toFixed(2)}</span></p>
                        <p className="text-lg text-white mb-4">Remaining: <span className={`font-bold ${remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currency}{remainingBudget.toFixed(2)}</span></p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${budgetProgress < 80 ? 'bg-indigo-500' : budgetProgress < 100 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{budgetProgress.toFixed(1)}% of budget spent</p>
                    </div>
                </div>

                {/* Total Balance Card (Placeholder) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Total Balance</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Track your overall financial health.</p>
                        <p className="text-4xl font-bold text-purple-700 dark:text-purple-400">{currency}0.00</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This feature will be implemented in future updates.</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CategorySpendingChart transactions={transactions} />
                <MonthlySpendingChart transactions={transactions} />
            </div>
        </div>
    );
};

// =============================================================================
// pages/TransactionsPage.jsx
// =============================================================================
const TransactionsPage = () => {
    const { transactions, settings } = useLocalStorageData();
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-0">All Transactions</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={() => setShowAddTransactionModal(true)}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        Add New Transaction
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        Export Transactions
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <TransactionList transactions={transactions} />
            </div>

            {showAddTransactionModal && (
                <AddTransactionModal
                    onClose={() => setShowAddTransactionModal(false)}
                />
            )}

            {showExportModal && (
                <ExportModal
                    transactions={transactions}
                    currency={settings.currency}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
};

// =============================================================================
// pages/BudgetPage.jsx
// =============================================================================
const BudgetPage = () => {
    const { budgets, setBudgets, settings } = useLocalStorageData();
    const [showSetBudgetModal, setShowSetBudgetModal] = useState(false);
    const [currentMonthBudget, setCurrentMonthBudget] = useState(0);
    const { currency } = settings;

    // Update current month's budget whenever budgets change
    useEffect(() => {
        const today = new Date();
        const currentMonthYear = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        const budgetForCurrentMonth = budgets.find(b => b.monthYear === currentMonthYear);
        setCurrentMonthBudget(budgetForCurrentMonth ? budgetForCurrentMonth.budgetAmount : 0);
    }, [budgets]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-0">Monthly Budgets</h2>
                <button
                    onClick={() => setShowSetBudgetModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                    Set Monthly Budget
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Current and Past Budgets</h3>
                {budgets.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No budgets set yet. Click "Set Monthly Budget" to add one.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">Month & Year</th>
                                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">Budget Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {budgets.sort((a,b) => new Date(b.monthYear) - new Date(a.monthYear)).map((budget) => (
                                    <tr key={budget.monthYear} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(budget.monthYear + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium text-green-600 dark:text-green-400">
                                            {currency}{budget.budgetAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showSetBudgetModal && (
                <SetBudgetModal
                    onClose={() => setShowSetBudgetModal(false)}
                    currentBudget={currentMonthBudget} // Pass current month's budget for pre-filling
                />
            )}
        </div>
    );
};

// =============================================================================
// pages/SettingsPage.jsx
// =============================================================================
const SettingsPage = () => {
    const { settings, setSettings } = useLocalStorageData();
    const [profilePictureUrl, setProfilePictureUrl] = useState(settings.profilePictureUrl);
    const [name, setName] = useState(settings.name);
    const [currency, setCurrency] = useState(settings.currency);
    const [message, setMessage] = useState('');

    const handleSaveSettings = (e) => {
        e.preventDefault();
        setSettings(prevSettings => ({ ...prevSettings, profilePictureUrl, name, currency }));
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    };

    const currencyOptions = [
        { symbol: '$', name: 'US Dollar' },
        { symbol: '€', name: 'Euro' },
        { symbol: '£', name: 'British Pound' },
        { symbol: '¥', name: 'Japanese Yen' },
        { symbol: '₹', name: 'Indian Rupee' },
        { symbol: 'CAD', name: 'Canadian Dollar' },
        { symbol: 'AUD', name: 'Australian Dollar' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Settings</h2>
                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        {message}
                    </div>
                )}
                <form onSubmit={handleSaveSettings} className="space-y-5">
                    <div>
                        <label htmlFor="profilePictureUrl" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Profile Picture URL</label>
                        <input
                            type="url"
                            id="profilePictureUrl"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={profilePictureUrl}
                            onChange={(e) => setProfilePictureUrl(e.target.value)}
                            placeholder="e.g., https://example.com/my-profile.jpg"
                        />
                        {profilePictureUrl && (
                            <div className="mt-4 flex justify-center">
                                <img
                                    src={profilePictureUrl}
                                    alt="Profile Preview"
                                    className="w-24 h-24 rounded-full object-cover shadow-md"
                                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x96/cccccc/333333?text=Error"; }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="currency" className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Currency</label>
                        <select
                            id="currency"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            required
                        >
                            {currencyOptions.map(option => (
                                <option key={option.symbol} value={option.symbol}>
                                    {option.symbol} - {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                    >
                        Save Settings
                    </button>
                </form>
            </div>
        </div>
    );
};

// =============================================================================
// AuthPage.jsx
// =============================================================================
// In a real app, this would be a secure secret key on the server.
// For local demo, it's hardcoded, which is INSECURE.
const LOCAL_JWT_SECRET = 'your-super-secret-key-for-local-demo-only';

const AuthPage = () => {
    const { login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }

        try {
            if (isLogin) {
                const success = login(username, password);
                if (!success) {
                    setError('Invalid username or password.');
                }
            } else {
                const success = signup(username, password);
                if (success) {
                    setMessage('Registration successful! Please log in.');
                    setIsLogin(true); // Switch to login form after successful signup
                } else {
                    setError('Username already exists.');
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError("An unexpected error occurred.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-gray-800 dark:to-gray-900 p-4">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
                    {isLogin ? 'Login' : 'Sign Up'}
                </h2>
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                {message && <p className="text-green-500 text-sm text-center mb-4">{message}</p>}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
                    >
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
                {/* <p className="mt-4 text-center text-red-500 text-sm">
                    **Security Warning:** This is a client-side only authentication for demo purposes and is highly insecure for real applications.
                </p> */}
            </div>
        </div>
    );
};

// =============================================================================
// App.jsx (Main Application Component)
// =============================================================================
const App = () => {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [settings, setSettings] = useState({
        profilePictureUrl: '',
        name: 'User',
        currency: '$',
        isDarkMode: false
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // Stores username of logged-in user
    const [loadingAuth, setLoadingAuth] = useState(true); // Loading state for initial auth check
    const [selectedTab, setSelectedTab] = useState('overview');

    // Simulated JWT functions (INSECURE for production)
    const signToken = (payload) => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const encodedPayload = btoa(JSON.stringify(payload));
        // Simple "signature" for local demo - NOT cryptographically secure
        const signature = btoa(LOCAL_JWT_SECRET + encodedPayload);
        return `${header}.${encodedPayload}.${signature}`;
    };

    const verifyToken = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const [header, encodedPayload, signature] = parts;
            const expectedSignature = btoa(LOCAL_JWT_SECRET + encodedPayload);

            if (signature !== expectedSignature) {
                console.warn("JWT signature mismatch (simulated).");
                return null;
            }

            const payload = JSON.parse(atob(encodedPayload));
            // In a real JWT, you'd check exp, iat, etc.
            return payload;
        } catch (e) {
            console.error("Error verifying token:", e);
            return null;
        }
    };

    // User data storage prefix
    const getUserDataKey = (key) => `financialTracker_${currentUser}_${key}`;

    // Auth functions for context
    const login = (username, password) => {
        const users = JSON.parse(localStorage.getItem('financialTracker_users') || '{}');
        if (users[username] && users[username].password === password) {
            const token = signToken({ username });
            localStorage.setItem('financialTracker_jwt', token);
            setCurrentUser(username);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const signup = (username, password) => {
        let users = JSON.parse(localStorage.getItem('financialTracker_users') || '{}');
        if (users[username]) {
            return false; // Username already exists
        }
        users[username] = { password: password }; // Store password in plain text for demo (INSECURE)
        localStorage.setItem('financialTracker_users', JSON.stringify(users));
        const token = signToken({ username });
        localStorage.setItem('financialTracker_jwt', token);
        setCurrentUser(username);
        setIsAuthenticated(true);
        return true;
    };

    const logout = () => {
        localStorage.removeItem('financialTracker_jwt');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setTransactions([]); // Clear data on logout
        setBudgets([]);
        setSettings({ profilePictureUrl: '', name: 'User', currency: '$', isDarkMode: false });
        document.documentElement.classList.remove('dark'); // Reset dark mode
    };

    // Initial authentication check on app load
    useEffect(() => {
        const token = localStorage.getItem('financialTracker_jwt');
        if (token) {
            const payload = verifyToken(token);
            if (payload && payload.username) {
                setCurrentUser(payload.username);
                setIsAuthenticated(true);
            } else {
                localStorage.removeItem('financialTracker_jwt'); // Remove invalid token
            }
        }
        setLoadingAuth(false);
    }, []);

    // Load user-specific data when currentUser changes
    useEffect(() => {
        if (currentUser) {
            try {
                const storedTransactions = localStorage.getItem(getUserDataKey('transactions'));
                if (storedTransactions) {
                    setTransactions(JSON.parse(storedTransactions));
                } else {
                    setTransactions([]); // Reset if no data for this user
                }

                const storedBudgets = localStorage.getItem(getUserDataKey('budgets'));
                if (storedBudgets) {
                    setBudgets(JSON.parse(storedBudgets));
                } else {
                    setBudgets([]); // Reset if no data for this user
                }

                const storedSettings = localStorage.getItem(getUserDataKey('settings'));
                if (storedSettings) {
                    setSettings(JSON.parse(storedSettings));
                } else {
                    // Default settings for new user
                    setSettings({ profilePictureUrl: '', name: currentUser, currency: '$', isDarkMode: false });
                }
            } catch (error) {
                console.error("Error loading user data from local storage:", error);
                // Fallback to default if data is corrupted
                setTransactions([]);
                setBudgets([]);
                setSettings({ profilePictureUrl: '', name: currentUser, currency: '$', isDarkMode: false });
            }
        }
    }, [currentUser]); // Re-run when currentUser changes

    // Save user-specific data whenever it changes
    useEffect(() => {
        if (currentUser && !loadingAuth) { // Only save after initial auth check and if user is logged in
            try {
                localStorage.setItem(getUserDataKey('transactions'), JSON.stringify(transactions));
            } catch (error) {
                console.error("Error saving transactions to local storage:", error);
            }
        }
    }, [transactions, currentUser, loadingAuth]);

    useEffect(() => {
        if (currentUser && !loadingAuth) {
            try {
                localStorage.setItem(getUserDataKey('budgets'), JSON.stringify(budgets));
            } catch (error) {
                console.error("Error saving budgets to local storage:", error);
            }
        }
    }, [budgets, currentUser, loadingAuth]);

    useEffect(() => {
        if (currentUser && !loadingAuth) {
            try {
                localStorage.setItem(getUserDataKey('settings'), JSON.stringify(settings));
                if (settings.isDarkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (error) {
                console.error("Error saving settings to local storage:", error);
            }
        }
    }, [settings, currentUser, loadingAuth]);

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading Financial Tracker...</div>
            </div>
        );
    }

    const toggleDarkMode = () => {
        setSettings(prevSettings => ({
            ...prevSettings,
            isDarkMode: !prevSettings.isDarkMode
        }));
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, login, signup, logout }}>
            <LocalStorageContext.Provider value={{ transactions, setTransactions, budgets, setBudgets, settings, setSettings }}>
                <ExternalScripts />
                <div className={`min-h-screen font-sans ${settings.isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
                    {isAuthenticated ? (
                        <>
                            <header className="bg-white dark:bg-gray-800 p-4 shadow-lg mb-6 relative">
                                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
                                    <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-4 sm:mb-0">Spendroid</h1>
                                    <nav className="flex flex-wrap justify-center sm:justify-start space-x-2 sm:space-x-4">
                                        <button
                                            onClick={() => setSelectedTab('overview')}
                                            className={`px-4 py-2 rounded-lg font-medium transition duration-300 cursor-pointer ${
                                                selectedTab === 'overview'
                                                    ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('transactions')}
                                            className={`px-4 py-2 rounded-lg font-medium transition duration-300 cursor-pointer ${
                                                selectedTab === 'transactions'
                                                    ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Transactions
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('budget')}
                                            className={`px-4 py-2 rounded-lg font-medium transition duration-300 cursor-pointer ${
                                                selectedTab === 'budget'
                                                    ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Budget
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('settings')}
                                            className={`px-4 py-2 rounded-lg font-medium transition duration-300 cursor-pointer ${
                                                selectedTab === 'settings'
                                                    ? 'bg-indigo-600 text-white shadow-md dark:bg-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            Settings
                                        </button>
                                        <button
                                            onClick={toggleDarkMode}
                                            className="p-2 rounded-lg cursor-pointer font-medium transition duration-300 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                                        >
                                            {settings.isDarkMode ? (
                                                    <Sun/>
                                            ) : (
                                                <Moon/>
                                            )}
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md cursor-pointer hover:bg-red-600 transition duration-300"
                                        >
                                            Logout
                                        </button>
                                    </nav>
                                </div>
                            </header>

                            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                                {selectedTab === 'overview' && <DashboardPage />}
                                {selectedTab === 'transactions' && <TransactionsPage />}
                                {selectedTab === 'budget' && <BudgetPage />}
                                {selectedTab === 'settings' && <SettingsPage />}
                            </main>
                        </>
                    ) : (
                        <AuthPage />
                    )}
                </div>
            </LocalStorageContext.Provider>
        </AuthContext.Provider>
    );
};

export default App;
