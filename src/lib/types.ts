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
