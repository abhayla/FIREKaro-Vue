import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { grokClient } from '../lib/grok-client'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Default expense categories for rule-based fallback
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'food', 'lunch', 'dinner', 'breakfast', 'grocery', 'bigbasket', 'blinkit', 'zepto', 'dunzo'],
  'Transportation': ['uber', 'ola', 'rapido', 'metro', 'petrol', 'diesel', 'fuel', 'parking', 'toll', 'fastag', 'bus', 'train', 'auto'],
  'Utilities': ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'phone', 'mobile', 'recharge', 'airtel', 'jio', 'vi', 'bsnl'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'shopping', 'clothes', 'fashion', 'electronics', 'mall'],
  'Entertainment': ['netflix', 'prime', 'hotstar', 'spotify', 'movie', 'pvr', 'inox', 'game', 'subscription', 'youtube'],
  'Healthcare': ['hospital', 'doctor', 'medicine', 'pharmacy', 'medical', 'apollo', 'medplus', '1mg', 'pharmeasy', 'health', 'clinic'],
  'Housing': ['rent', 'maintenance', 'society', 'repair', 'plumber', 'electrician', 'carpenter'],
  'Education': ['course', 'udemy', 'coursera', 'book', 'school', 'college', 'tuition', 'class', 'training'],
  'Personal': ['gym', 'salon', 'spa', 'haircut', 'grooming', 'fitness'],
  'Travel': ['hotel', 'flight', 'makemytrip', 'goibibo', 'booking', 'airbnb', 'trip', 'vacation', 'holiday'],
  'Gifts & Donations': ['gift', 'donation', 'charity', 'present'],
  'EMI & Loans': ['emi', 'loan', 'credit card', 'hdfc', 'icici', 'sbi', 'axis', 'kotak'],
}

// Categorization response schema
const categorizationResponseSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string()).optional(),
})

type CategorizationResponse = z.infer<typeof categorizationResponseSchema>

// GET /api/expenses/ai/categorize - Categorize a single expense description
app.get('/categorize', async (c) => {
  const description = c.req.query('description')
  const merchant = c.req.query('merchant')
  const amount = c.req.query('amount')

  if (!description) {
    return c.json({ success: false, error: 'Description is required' }, 400)
  }

  try {
    // Try Grok AI first
    const result = await categorizeWithGrok(description, merchant, amount)
    return c.json(result)
  } catch (error) {
    console.error('Grok categorization failed, using rule-based fallback:', error)
    // Fallback to rule-based categorization
    const result = categorizeByRules(description, merchant)
    return c.json(result)
  }
})

// POST /api/expenses/ai/batch-categorize - Categorize multiple expenses
app.post(
  '/batch-categorize',
  zValidator(
    'json',
    z.object({
      expenses: z.array(
        z.object({
          id: z.string().optional(),
          description: z.string(),
          merchant: z.string().optional(),
          amount: z.number().optional(),
        })
      ),
    })
  ),
  async (c) => {
    const { expenses } = c.req.valid('json')

    const results = await Promise.all(
      expenses.map(async (expense) => {
        try {
          const result = await categorizeWithGrok(
            expense.description,
            expense.merchant,
            expense.amount?.toString()
          )
          return { id: expense.id, ...result }
        } catch {
          const result = categorizeByRules(expense.description, expense.merchant)
          return { id: expense.id, ...result }
        }
      })
    )

    return c.json(results)
  }
)

// POST /api/expenses/ai/process-receipt - Process receipt image with OCR
app.post('/process-receipt', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['receipt'] as File | undefined

    if (!file) {
      return c.json({ success: false, error: 'Receipt image is required' }, 400)
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Process with Grok Vision
    const prompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "merchant": "store/restaurant name",
  "date": "YYYY-MM-DD format",
  "total": numeric amount without currency symbol,
  "items": [{"name": "item name", "amount": numeric price}],
  "paymentMethod": "CASH/CREDIT_CARD/DEBIT_CARD/UPI/OTHER",
  "category": "most likely expense category"
}

If any field cannot be determined, use null. For the category, choose from:
Food & Dining, Transportation, Utilities, Shopping, Entertainment, Healthcare, Housing, Education, Personal, Travel, Gifts & Donations, EMI & Loans, Other`

    const response = await grokClient.vision({
      imageBase64: base64,
      prompt,
      mimeType,
    })

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return c.json({
        success: true,
        data: {
          merchant: data.merchant,
          date: data.date,
          amount: data.total,
          items: data.items || [],
          paymentMethod: data.paymentMethod || 'OTHER',
          suggestedCategory: data.category || 'Other',
        },
      })
    }

    return c.json({
      success: false,
      error: 'Could not parse receipt data',
      rawResponse: response,
    })
  } catch (error) {
    console.error('Receipt processing error:', error)
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process receipt',
      },
      500
    )
  }
})

// GET /api/expenses/ai/insights - Generate spending insights
app.get('/insights', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') // Format: YYYY-MM

  // For now, return mock insights
  // This will be enhanced in GAP 3 with real Grok analysis
  const insights = [
    {
      type: 'spending_trend',
      title: 'Monthly Spending Trend',
      message: 'Your spending this month is within budget. Keep it up!',
      severity: 'info',
    },
    {
      type: 'category_anomaly',
      title: 'Food & Dining Alert',
      message: 'You spent 20% more on Food & Dining compared to last month.',
      severity: 'warning',
    },
    {
      type: 'savings_opportunity',
      title: 'Subscription Review',
      message: 'Consider reviewing your entertainment subscriptions to save ₹500/month.',
      severity: 'info',
    },
  ]

  return c.json({
    success: true,
    data: { insights, month: month || 'current', userId },
  })
})

/**
 * Categorize expense using Grok AI
 */
async function categorizeWithGrok(
  description: string,
  merchant?: string | null,
  amount?: string | null
): Promise<CategorizationResponse> {
  const prompt = `Categorize this expense into one of these categories:
- Food & Dining (groceries, restaurants, food delivery)
- Transportation (fuel, cab, metro, parking)
- Utilities (electricity, water, internet, phone)
- Shopping (clothes, electronics, online shopping)
- Entertainment (movies, streaming, games)
- Healthcare (medical, pharmacy, doctor)
- Housing (rent, maintenance, repairs)
- Education (courses, books, tuition)
- Personal (gym, salon, subscriptions)
- Travel (hotels, flights, vacation)
- Gifts & Donations (gifts, charity)
- EMI & Loans (loan payments, credit card)
- Other (miscellaneous)

Expense details:
- Description: ${description}
${merchant ? `- Merchant: ${merchant}` : ''}
${amount ? `- Amount: ₹${amount}` : ''}

Respond in JSON format ONLY:
{"category": "Category Name", "subcategory": "optional subcategory", "confidence": 0.0-1.0, "suggestions": ["alt1", "alt2"]}`

  const response = await grokClient.chat({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 200,
  })

  // Parse JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    return {
      category: data.category || 'Other',
      subcategory: data.subcategory,
      confidence: Math.min(1, Math.max(0, data.confidence || 0.5)),
      suggestions: data.suggestions || [],
    }
  }

  // If parsing fails, extract category from text
  const categories = [
    'Food & Dining',
    'Transportation',
    'Utilities',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Housing',
    'Education',
    'Personal',
    'Travel',
    'Gifts & Donations',
    'EMI & Loans',
  ]

  for (const cat of categories) {
    if (response.toLowerCase().includes(cat.toLowerCase())) {
      return { category: cat, confidence: 0.6 }
    }
  }

  return { category: 'Other', confidence: 0.3 }
}

/**
 * Rule-based categorization fallback
 */
function categorizeByRules(
  description: string,
  merchant?: string | null
): CategorizationResponse {
  const searchText = `${description} ${merchant || ''}`.toLowerCase()

  let bestMatch = { category: 'Other', score: 0 }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        const score = keyword.length / searchText.length
        if (score > bestMatch.score) {
          bestMatch = { category, score }
        }
      }
    }
  }

  return {
    category: bestMatch.category,
    confidence: bestMatch.category === 'Other' ? 0.3 : Math.min(0.8, 0.5 + bestMatch.score),
    suggestions:
      bestMatch.category === 'Other'
        ? ['Shopping', 'Personal', 'Entertainment']
        : undefined,
  }
}

export default app
