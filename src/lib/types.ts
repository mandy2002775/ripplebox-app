export type UserType = 'client' | 'salon' | 'admin';

export type Client = {
  id: string;
  referral_code: string;
};

export type Salon = {
  id: string;
  business_name: string;
  location: string;
  website: string | null;
  instagram_handle: string | null;
  google_place_id: string | null;
  logo_url: string | null;
  subscription_status: string;
};

export type User = {
  id: string;
  phone_number: string;
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
