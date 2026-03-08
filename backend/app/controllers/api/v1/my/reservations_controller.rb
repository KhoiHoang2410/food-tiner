module Api
  module V1
    module My
      class ReservationsController < Api::V1::BaseController
        before_action :require_owner!

        def index
          render json: my_restaurant.reservations.order(created_at: :desc)
        end

        def update
          reservation = my_restaurant.reservations.find(params[:id])
          reservation.update!(status: params[:status])
          render json: reservation
        end

        private

        def my_restaurant
          @my_restaurant ||= Restaurant.find_by(owner_id: current_user.id) ||
                             raise(FoodTinderError.new('TF3001'))
        end

        def require_owner!
          require_role!(:restaurant_owner)
        end
      end
    end
  end
end
