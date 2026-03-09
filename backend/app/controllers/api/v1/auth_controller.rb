module Api
  module V1
    class AuthController < ActionController::API
      rescue_from FoodTinderError do |e|
        render json: { errors: [{ message: e.message, error_code: e.code }] },
               status: e.http_status
      end

      def register
        raise FoodTinderError.new('TF1005') unless User.roles.key?(params[:role])

        user = User.new(email: params[:email], password: params[:password], role: params[:role])
        raise FoodTinderError.new('TF1004') unless user.save

        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        render json: { token: token, user: { id: user.id, email: user.email, role: user.role } },
               status: :created
      end

      def login
        user = User.find_by(email: params[:email])
        raise FoodTinderError.new('TF1003') unless user&.valid_password?(params[:password])

        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        render json: { token: token, user: { id: user.id, email: user.email, role: user.role } }
      end

      def logout
        render json: { message: 'Logged out' }
      end
    end
  end
end
