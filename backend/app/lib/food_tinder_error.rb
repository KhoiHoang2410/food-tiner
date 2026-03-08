class FoodTinderError < StandardError
  CODES = {
    TF1001: { status: 401, message: 'Missing or invalid token' },
    TF1002: { status: 401, message: 'Token expired' },
    TF1003: { status: 400, message: 'Invalid credentials' },
    TF1004: { status: 422, message: 'Email already registered' },
    TF1005: { status: 400, message: 'Invalid role' },
    TF2001: { status: 400, message: 'Insufficient role for this action' },
    TF2002: { status: 400, message: 'Resource does not belong to current user' },
    TF3001: { status: 404, message: 'Restaurant not found' },
    TF3002: { status: 422, message: 'Restaurant already exists for this owner' },
    TF3003: { status: 422, message: 'Max photos limit reached (5)' },
    TF3004: { status: 422, message: 'Invalid image format or size' },
    TF4001: { status: 404, message: 'Reservation not found' },
    TF4002: { status: 422, message: 'Pending reservation already exists for this restaurant' },
    TF4003: { status: 422, message: 'Cannot cancel a confirmed/rejected reservation' },
    TF5001: { status: 422, message: 'Validation failed' },
    TF5002: { status: 404, message: 'Resource not found' },
    TF5003: { status: 500, message: 'Internal server error' }
  }.freeze

  attr_reader :code, :http_status

  def initialize(code, message = nil)
    @code = code
    config = CODES[code.to_sym] || CODES[:TF5003]
    @http_status = config[:status]
    super(message || config[:message])
  end
end
