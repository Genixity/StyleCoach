import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function useSubscription() {
    const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);

    const updateSubscriptionStatus = (customerInfo: CustomerInfo) => {
        const isSubscribed = customerInfo.entitlements.active['Premium'] !== undefined;
        setIsSubscriber(isSubscribed);
    };

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const customerInfo = await Purchases.getCustomerInfo();
                updateSubscriptionStatus(customerInfo);
            } catch (e) {
                console.error('Failed to fetch subscription status', e);
                setIsSubscriber(false);
            }
        };

        checkSubscription();

        const customerInfoUpdateListener = (customerInfo: CustomerInfo) => {
            updateSubscriptionStatus(customerInfo);
        };

        Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

        return () => {
            Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
        };
    }, []);

    return {
        isSubscriber,
    };
}