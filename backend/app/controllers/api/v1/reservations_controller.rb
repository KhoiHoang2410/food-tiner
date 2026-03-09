module Api
  module V1
    class ReservationsController < Api::V1::BaseController
      def index
        render json: current_user.reservations.order(created_at: :desc)
      end

      def create
        existing = Reservation.find_by(
          user: current_user,
          restaurant_id: params[:restaurant_id],
          status: :pending
        )
        raise FoodTinderError.new('TF4002') if existing

        reservation = current_user.reservations.create!(reservation_params.merge(status: :pending))
        render json: reservation, status: :created
      end

      def destroy
        reservation = current_user.reservations.find(params[:id])
        raise FoodTinderError.new('TF4003') unless reservation.pending?

        reservation.update!(status: :cancelled)
        render json: reservation
      end

      private

      def reservation_params
        params.permit(:restaurant_id, :party_size, :requested_at, :note)
      end
    end
  end
end
