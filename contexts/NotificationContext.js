import React, { createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext(null);

//Provider component for notification context
export const NotificationProvider = ({children}) =>{
    const notificationUtils = useNotifications();
    return (
        <NotificationContext.Provider value={notificationUtils}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () =>{
    const context = useContext(NotificationContext);

    if(!context){
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }

    return context;
};