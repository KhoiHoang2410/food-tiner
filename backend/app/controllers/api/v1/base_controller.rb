module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_user!

      rescue_from FoodTinderError do |e|
        render json: { errors: [{ message: e.message, error_code: e.code }] },
               status: e.http_status
      end

      rescue_from ActiveRecord::RecordNotFound do |_|
        render json: { errors: [{ message: 'Resource not found', error_code: 'TF5002' }] },
               status: :not_found
      end

      rescue_from ActiveRecord::RecordInvalid do |e|
        render json: { errors: [{ message: e.record.errors.full_messages.join(', '), error_code: 'TF5001' }] },
               status: :unprocessable_entity
      end

      private

      def require_role!(role)
        raise FoodTinderError.new('TF2001') unless current_user.role == role.to_s
      end

      def current_user
        @current_user ||= warden.authenticate(scope: :user)
      end

      def authenticate_user!
        raise FoodTinderError.new('TF1001') unless current_user
      end
    end
  end
end
