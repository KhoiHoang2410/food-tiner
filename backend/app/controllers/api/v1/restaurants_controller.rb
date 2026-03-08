module Api
  module V1
    class RestaurantsController < Api::V1::BaseController
      def index
        restaurants = Restaurant.where(is_active: true)

        if params[:lat].present? && params[:lng].present?
          radius = (params[:radius_km] || 10).to_f
          restaurants = restaurants.near([params[:lat].to_f, params[:lng].to_f], radius, units: :km)
        end

        restaurants = restaurants.where(cuisine_type: params[:cuisine]) if params[:cuisine].present?
        restaurants = restaurants.where(price_range: params[:price_range].to_i) if params[:price_range].present?

        already_swiped = Swipe.where(user: current_user).pluck(:restaurant_id)
        restaurants = restaurants.where.not(id: already_swiped) if already_swiped.any?

        render json: restaurants.page(params[:page]).per(10)
      end

      def show
        render json: Restaurant.find(params[:id])
      end
    end
  end
end
