puts "Seeding development data..."

# ── Users ──────────────────────────────────────────────────────────────────────

diner = User.find_or_create_by!(email: "diner@example.com") do |u|
  u.password = "password"
  u.role = :diner
end

diner2 = User.find_or_create_by!(email: "diner2@example.com") do |u|
  u.password = "password"
  u.role = :diner
end

owner1 = User.find_or_create_by!(email: "owner1@example.com") do |u|
  u.password = "password"
  u.role = :restaurant_owner
end

owner2 = User.find_or_create_by!(email: "owner2@example.com") do |u|
  u.password = "password"
  u.role = :restaurant_owner
end

puts "  #{User.count} users"

# ── Restaurants ────────────────────────────────────────────────────────────────

restaurants_data = [
  {
    owner: owner1,
    name: "Pho Saigon",
    description: "Authentic Vietnamese pho and banh mi in the heart of the city.",
    phone: "028-1234-5678",
    address: "12 Nguyen Hue, District 1, Ho Chi Minh City",
    latitude: 10.7769,
    longitude: 106.7009,
    cuisine_type: "Vietnamese",
    price_range: :budget,
    opening_hours: { mon: "07:00-22:00", tue: "07:00-22:00", wed: "07:00-22:00",
                     thu: "07:00-22:00", fri: "07:00-23:00", sat: "08:00-23:00", sun: "08:00-21:00" },
    is_active: true
  },
  {
    owner: owner1,
    name: "The Bun House",
    description: "Steamed buns, dumplings and dim sum. Casual lunch spot with queues worth joining.",
    phone: "028-2222-3333",
    address: "45 Le Loi, District 1, Ho Chi Minh City",
    latitude: 10.7740,
    longitude: 106.7030,
    cuisine_type: "Chinese",
    price_range: :moderate,
    opening_hours: { mon: "11:00-21:00", tue: "11:00-21:00", wed: "closed",
                     thu: "11:00-21:00", fri: "11:00-22:00", sat: "10:00-22:00", sun: "10:00-20:00" },
    is_active: true
  },
  {
    owner: owner2,
    name: "Grill & Chill",
    description: "Korean BBQ with premium cuts, unlimited sides, and great cocktails.",
    phone: "028-9876-5432",
    address: "88 Bui Vien, District 1, Ho Chi Minh City",
    latitude: 10.7690,
    longitude: 106.6920,
    cuisine_type: "Korean",
    price_range: :pricey,
    opening_hours: { mon: "17:00-23:00", tue: "17:00-23:00", wed: "17:00-23:00",
                     thu: "17:00-23:00", fri: "17:00-00:00", sat: "17:00-00:00", sun: "17:00-22:00" },
    is_active: true
  },
  {
    owner: owner2,
    name: "Pasta Rossa",
    description: "Family-run Italian trattoria. Hand-rolled pasta, wood-fired pizza, imported wine.",
    phone: "028-5555-6666",
    address: "5 Thai Van Lung, District 1, Ho Chi Minh City",
    latitude: 10.7800,
    longitude: 106.7050,
    cuisine_type: "Italian",
    price_range: :pricey,
    opening_hours: { mon: "11:30-22:00", tue: "11:30-22:00", wed: "11:30-22:00",
                     thu: "11:30-22:00", fri: "11:30-23:00", sat: "12:00-23:00", sun: "12:00-21:00" },
    is_active: true
  },
  {
    owner: owner1,
    name: "Curry Leaf",
    description: "South Indian street food — dosas, curries, and freshly squeezed lassi.",
    phone: "028-7777-8888",
    address: "22 Dong Du, District 1, Ho Chi Minh City",
    latitude: 10.7760,
    longitude: 106.7020,
    cuisine_type: "Indian",
    price_range: :budget,
    opening_hours: { mon: "10:00-21:00", tue: "10:00-21:00", wed: "10:00-21:00",
                     thu: "10:00-21:00", fri: "10:00-22:00", sat: "10:00-22:00", sun: "closed" },
    is_active: true
  },
  {
    owner: owner2,
    name: "Omakase 88",
    description: "Chef's choice Japanese tasting menu. Reservations strongly recommended.",
    phone: "028-0000-1111",
    address: "1 Mac Thi Buoi, District 1, Ho Chi Minh City",
    latitude: 10.7830,
    longitude: 106.7060,
    cuisine_type: "Japanese",
    price_range: :luxury,
    opening_hours: { mon: "closed", tue: "18:00-22:00", wed: "18:00-22:00",
                     thu: "18:00-22:00", fri: "18:00-23:00", sat: "17:00-23:00", sun: "17:00-21:00" },
    is_active: true
  },
]

restaurants = restaurants_data.map do |data|
  owner = data.delete(:owner)
  Restaurant.find_or_create_by!(name: data[:name]) do |r|
    r.assign_attributes(data)
    r.owner_id = owner.id
  end
end

puts "  #{Restaurant.count} restaurants"

# ── Specials ───────────────────────────────────────────────────────────────────

specials_data = [
  { restaurant: restaurants[0], title: "Lunch Combo", description: "Pho + spring rolls + iced tea for 120k VND", valid_until: 2.months.from_now },
  { restaurant: restaurants[1], title: "Weekend Dim Sum Brunch", description: "All-you-can-eat dim sum every Sat/Sun 10am–1pm", valid_until: 1.month.from_now },
  { restaurant: restaurants[2], title: "Happy Hour BBQ", description: "20% off all meat platters Mon–Thu 5–7pm", valid_until: 3.months.from_now },
  { restaurant: restaurants[3], title: "Date Night Set", description: "3-course dinner for two with house wine, 900k VND", valid_until: 2.months.from_now },
  { restaurant: restaurants[5], title: "Early Bird Omakase", description: "First seating (6pm) at 15% off — Tue/Wed only", valid_until: 1.month.from_now },
]

specials_data.each do |data|
  restaurant = data.delete(:restaurant)
  Special.find_or_create_by!(restaurant: restaurant, title: data[:title]) do |s|
    s.assign_attributes(data)
  end
end

puts "  #{Special.count} specials"

# ── Swipes ─────────────────────────────────────────────────────────────────────

swipe_data = [
  { user: diner,  restaurant: restaurants[0], direction: :right },
  { user: diner,  restaurant: restaurants[1], direction: :right },
  { user: diner,  restaurant: restaurants[2], direction: :left  },
  { user: diner,  restaurant: restaurants[3], direction: :right },
  { user: diner2, restaurant: restaurants[0], direction: :left  },
  { user: diner2, restaurant: restaurants[4], direction: :right },
  { user: diner2, restaurant: restaurants[5], direction: :right },
]

swipe_data.each do |data|
  Swipe.find_or_create_by!(user: data[:user], restaurant: data[:restaurant]) do |s|
    s.direction = data[:direction]
  end
end

puts "  #{Swipe.count} swipes"

# ── Reservations ───────────────────────────────────────────────────────────────

reservation_data = [
  { user: diner,  restaurant: restaurants[0], party_size: 2, requested_at: 1.day.from_now.change(hour: 12), note: "Window seat if possible", status: :confirmed },
  { user: diner,  restaurant: restaurants[3], party_size: 2, requested_at: 3.days.from_now.change(hour: 19), note: "Anniversary dinner", status: :pending },
  { user: diner2, restaurant: restaurants[5], party_size: 1, requested_at: 5.days.from_now.change(hour: 18), note: "", status: :pending },
  { user: diner2, restaurant: restaurants[2], party_size: 4, requested_at: 2.days.from_now.change(hour: 18), note: "One vegetarian", status: :rejected },
]

reservation_data.each do |data|
  Reservation.find_or_create_by!(user: data[:user], restaurant: data[:restaurant], requested_at: data[:requested_at]) do |r|
    r.party_size = data[:party_size]
    r.note = data[:note]
    r.status = data[:status]
  end
end

puts "  #{Reservation.count} reservations"
puts "Done!"
puts ""
puts "Login credentials (password: 'password'):"
puts "  diner@example.com       — diner"
puts "  diner2@example.com      — diner"
puts "  owner1@example.com      — restaurant_owner"
puts "  owner2@example.com      — restaurant_owner"
