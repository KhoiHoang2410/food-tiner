require 'rails_helper'

RSpec.describe FoodTinderError do
  it 'has error code and message' do
    error = FoodTinderError.new('TF1001', 'Missing or invalid token')
    expect(error.code).to eq('TF1001')
    expect(error.message).to eq('Missing or invalid token')
  end

  it 'uses default message from CODES when no message provided' do
    error = FoodTinderError.new('TF1002')
    expect(error.code).to eq('TF1002')
    expect(error.http_status).to eq(401)
  end

  it 'falls back to TF5003 for unknown codes' do
    error = FoodTinderError.new('UNKNOWN')
    expect(error.http_status).to eq(500)
  end
end
