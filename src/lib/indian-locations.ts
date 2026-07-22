// Curated popular localities for major Indian cities, used to power
// "Preferred area" suggestions without depending on a live places API.
// Keyed by canonical lowercase city name.
const POPULAR_AREAS_BY_CITY: Record<string, string[]> = {
  bengaluru: [
    "Koramangala", "HSR Layout", "Whitefield", "Indiranagar", "Electronic City",
    "Marathahalli", "Bellandur", "Yelahanka", "JP Nagar", "Hebbal",
    "Jayanagar", "BTM Layout", "Sarjapur Road", "Malleswaram", "Rajajinagar",
  ],
  delhi: [
    "Rohini", "Dwarka", "Saket", "Hauz Khas", "Lajpat Nagar",
    "Karol Bagh", "Janakpuri", "Vasant Kunj", "Rajouri Garden", "Pitampura",
    "Mayur Vihar", "Paharganj", "Connaught Place", "Chanakyapuri", "Preet Vihar",
  ],
  mumbai: [
    "Andheri", "Bandra", "Powai", "Borivali", "Dadar",
    "Goregaon", "Chembur", "Malad", "Colaba", "Lower Parel",
    "Kandivali", "Juhu", "Thane", "Vikhroli", "Ghatkopar",
  ],
  pune: [
    "Koregaon Park", "Viman Nagar", "Hinjewadi", "Kothrud", "Baner",
    "Aundh", "Wakad", "Kharadi", "Hadapsar", "Camp",
  ],
  hyderabad: [
    "Gachibowli", "Hitech City", "Banjara Hills", "Jubilee Hills", "Madhapur",
    "Kondapur", "Kukatpally", "Secunderabad", "Ameerpet", "Miyapur",
  ],
  chennai: [
    "Adyar", "T Nagar", "Velachery", "Anna Nagar", "OMR",
    "Nungambakkam", "Porur", "Tambaram", "Mylapore", "Guindy",
  ],
  kolkata: [
    "Salt Lake", "Park Street", "New Town", "Ballygunge", "Behala",
    "Howrah", "Rajarhat", "Garia", "Dum Dum", "Jadavpur",
  ],
  ahmedabad: [
    "Satellite", "Navrangpura", "Bodakdev", "Vastrapur", "Maninagar",
    "Prahlad Nagar", "Bopal", "Thaltej", "Chandkheda", "Naranpura",
  ],
  jaipur: [
    "Malviya Nagar", "Vaishali Nagar", "C Scheme", "Mansarovar", "Raja Park",
    "Jagatpura", "Bani Park", "Tonk Road", "Vidhyadhar Nagar", "Jhotwara",
  ],
  surat: [
    "Adajan", "Vesu", "Athwa", "City Light", "Piplod",
    "Varachha", "Katargam", "Pal", "Rander", "Ghod Dod Road",
  ],
  lucknow: [
    "Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar", "Alambagh",
    "Mahanagar", "Vikas Nagar", "Jankipuram", "Rajajipuram", "Chinhat",
  ],
  kanpur: [
    "Civil Lines", "Swaroop Nagar", "Kakadeo", "Kidwai Nagar", "Panki",
    "Kalyanpur", "Govind Nagar", "Shastri Nagar", "Vikas Nagar", "Rawatpur",
  ],
  nagpur: [
    "Dharampeth", "Sadar", "Civil Lines", "Sitabuldi", "Wardha Road",
    "Manish Nagar", "Pratap Nagar", "Hingna", "Ramdaspeth", "Trimurti Nagar",
  ],
  indore: [
    "Vijay Nagar", "Palasia", "Rajwada", "Bhawarkuan", "Sudama Nagar",
    "Bicholi Mardana", "Rau", "Scheme 78", "Annapurna Road", "Sapna Sangeeta",
  ],
  bhopal: [
    "Arera Colony", "MP Nagar", "Kolar Road", "Shahpura", "Habibganj",
    "New Market", "Bagh Sewania", "Bittan Market", "Char Imli", "Ayodhya Nagar",
  ],
  visakhapatnam: [
    "MVP Colony", "Dwaraka Nagar", "Madhurawada", "Gajuwaka", "Rushikonda",
    "Seethammadhara", "Pendurthi", "Yendada", "Gopalapatnam", "Siripuram",
  ],
  vadodara: [
    "Alkapuri", "Gotri", "Manjalpur", "Karelibaug", "Sayajigunj",
    "Fatehgunj", "Waghodia Road", "Akota", "Vasna", "Gorwa",
  ],
  ghaziabad: [
    "Indirapuram", "Vaishali", "Raj Nagar Extension", "Kaushambi", "Vasundhara",
    "Crossings Republik", "Sahibabad", "Govindpuram", "Nyay Khand", "Shastri Nagar",
  ],
  coimbatore: [
    "RS Puram", "Gandhipuram", "Peelamedu", "Saibaba Colony", "Race Course",
    "Ramanathapuram", "Saravanampatti", "Singanallur", "Vadavalli", "Ganapathy",
  ],
  kochi: [
    "Kakkanad", "Edappally", "Fort Kochi", "Vyttila", "Kaloor",
    "Panampilly Nagar", "Aluva", "Palarivattom", "Thrikkakara", "Marine Drive",
  ],
  chandigarh: [
    "Sector 17", "Sector 22", "Sector 35", "Sector 15", "Sector 8",
    "Sector 43", "Manimajra", "Sector 9", "Sector 7", "Sector 26",
  ],
  gurugram: [
    "DLF Phase 1", "DLF Phase 3", "Sohna Road", "Golf Course Road", "Sector 56",
    "MG Road", "Sushant Lok", "Cyber City", "Palam Vihar", "Sector 29",
  ],
  noida: [
    "Sector 62", "Sector 18", "Sector 137", "Sector 50", "Sector 78",
    "Sector 128", "Greater Noida West", "Sector 15", "Sector 76", "Sector 93",
  ],
  patna: [
    "Boring Road", "Kankarbagh", "Rajendra Nagar", "Patliputra Colony", "Danapur",
    "Bailey Road", "Kurji", "Fraser Road", "Anisabad", "Gola Road",
  ],
  bhubaneswar: [
    "Patia", "Chandrasekharpur", "Jaydev Vihar", "Nayapalli", "Saheed Nagar",
    "Khandagiri", "Rasulgarh", "Old Town", "Kalinga Nagar", "Niladri Vihar",
  ],
  guwahati: [
    "Zoo Road", "Ganeshguri", "Beltola", "Six Mile", "Dispur",
    "Christian Basti", "Uzan Bazar", "Hatigaon", "Silpukhuri", "Bhangagarh",
  ],
  dehradun: [
    "Rajpur Road", "Race Course", "Dalanwala", "Clement Town", "Vasant Vihar",
    "Sahastradhara Road", "Prem Nagar", "Malsi", "Ballupur", "Mothrowala",
  ],
  mysuru: [
    "Vijayanagar", "Jayalakshmipuram", "Saraswathipuram", "Kuvempunagar", "Gokulam",
    "Hebbal", "Vidyaranyapuram", "Bogadi", "Nazarbad", "Ramakrishnanagar",
  ],
};

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  "new delhi": "delhi",
  bombay: "mumbai",
  calcutta: "kolkata",
  gurgaon: "gurugram",
  mysore: "mysuru",
  poona: "pune",
};

export function normalizeCityName(city: string): string {
  const trimmed = city.trim().toLowerCase();
  return CITY_ALIASES[trimmed] ?? trimmed;
}

export function getCuratedAreas(city: string): string[] | null {
  const key = normalizeCityName(city);
  return POPULAR_AREAS_BY_CITY[key] ?? null;
}
