export type UserType = 'client' | 'salon' | 'admin';

export type Client = {
  id: string;
  referral_code: string;
};

export type PlanType = 'monthly' | 'annual';

export type SalonSubscription = {
  id: string;
  plan_type: PlanType;
  status: string;
  current_period_end: string;
};

export type SalonCategory =
  | 'hair'
  | 'nails'
  | 'skin'
  | 'brows_lashes'
  | 'barber'
  | 'spa'
  | 'makeup'
  | 'other';

export type Salon = {
  id: string;
  business_name: string;
  category: SalonCategory | null;
  location: string;
  website: string | null;
  instagram_handle: string | null;
  google_place_id: string | null;
  logo_url: string | null;
  subscription_status: string;
  subscription: SalonSubscription | null;
};

export type User = {
  id: string;
  phone_number: string;
  email: string | null;
  name: string;
  user_type: UserType;
  client: Client | null;
  salon: Salon | null;
};

export type VerifyOtpResponse = {
  token: string;
  user: User;
};

export type RewardType = 'gift_card' | 'free_service' | 'product' | 'vip_perk';
export type RecipientType = 'both' | 'referrer' | 'new_client';

export type Reward = {
  id: string;
  salon_id: string;
  reward_type: RewardType;
  reward_value: string;
  description: string;
  recipient_type: RecipientType;
  expiry_date: string;
  is_active: boolean;
  redemptions_count?: number;
};

export type ReferralStatus = 'pending' | 'engaged' | 'redeemed';

export type RecentReferral = {
  id: string;
  referrer_name: string;
  referred_name: string;
  status: ReferralStatus;
  created_at: string;
};

export type SalonDashboard = {
  referrals_count: number;
  converted_count: number;
  recent_referrals: RecentReferral[];
  active_rewards: Reward[];
};

export type SalonSummary = {
  id: string;
  business_name: string;
  category: SalonCategory | null;
  location: string;
  logo_url: string | null;
  top_reward: string | null;
  is_favorited: boolean;
};

export type ContentPost = {
  id: string;
  image_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
};

export type SalonContentPost = ContentPost & {
  liked_by_me: boolean;
};

export type SalonClientSummary = {
  id: string;
  name: string;
  referrals_made: number;
  is_customer: boolean;
  last_activity: string;
};

export type MyRedemption = {
  id: string;
  description: string;
  salon_name: string;
  redeemed_at: string;
};

export type MyReferral = {
  id: string;
  referred_name: string;
  salon_name: string;
  status: ReferralStatus;
  created_at: string;
};

export type ClientDashboard = {
  referrals_count: number;
  rewards_count: number;
  earned: number;
  referrals: MyReferral[];
  redemptions: MyRedemption[];
};

export type NotificationType = 'referral_redeemed' | 'reward_earned';

export type ReferralRedeemedPayload = {
  referral_id: string;
  referrer_name: string;
  referred_name: string;
};

export type RewardEarnedPayload = {
  referral_id: string;
  reward_description: string;
  reward_value: number;
  salon_name: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  payload: ReferralRedeemedPayload | RewardEarnedPayload;
  read_at: string | null;
  created_at: string;
};

export type NotificationsResponse = {
  unread_count: number;
  notifications: AppNotification[];
};

export type AdminStats = {
  active_salons_count: number;
  active_salons_this_week: number;
  total_clients_count: number;
  total_clients_this_week: number;
  total_referrals_count: number;
  total_referrals_this_week: number;
  monthly_revenue: number;
  pending_leads_count: number;
};

export type AdminSubscriptionSummary = {
  id: string;
  salon_name: string;
  plan_type: PlanType;
  status: string;
  current_period_end: string | null;
};

export type SalonLead = {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone_number: string | null;
  email: string | null;
  location: string | null;
  source: string;
  created_at: string;
};

export type ReportRange = '7' | '30' | '90' | 'all';

export type ReportDailyPoint = {
  date: string;
  shared: number;
  converted: number;
};

export type ReportTopSalon = {
  salon_name: string;
  referrals_count: number;
};

export type ReportsSummary = {
  referrals_count: number;
  conversions_count: number;
  revenue: number;
  cost_per_lead_pct: number;
  daily: ReportDailyPoint[];
  top_salons: ReportTopSalon[];
};
