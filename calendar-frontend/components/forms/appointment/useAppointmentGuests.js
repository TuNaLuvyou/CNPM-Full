import { useState, useEffect } from 'react';
import { getFriends } from '@/lib/api';

export function useAppointmentGuests({ initialData, currentUser }) {
    const [friends, setFriends] = useState([]);
    const [guests, setGuests] = useState(initialData?.invitations || []);
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const [guestSearch, setGuestSearch] = useState("");

    useEffect(() => {
        if (initialData?.invitations) {
            setGuests(initialData.invitations.filter(inv => inv.status !== 'declined'));
        }
    }, [initialData?.invitations]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            getFriends().then(setFriends).catch(console.error);
        }
    }, []);

    const filteredFriends = friends.map(conn => {
        const isSender = conn.sender === currentUser?.id;
        return {
            id: isSender ? conn.receiver : conn.sender,
            username: isSender ? conn.receiver_name : conn.sender_name,
            email: isSender ? conn.receiver_email : conn.sender_email,
            first_name: isSender ? conn.receiver_name : conn.sender_name,
        };
    }).filter(f => {
        if (!guestSearch) return true;
        const s = guestSearch.toLowerCase();
        return (f.username?.toLowerCase().includes(s) || 
                f.first_name?.toLowerCase().includes(s) || 
                f.email?.toLowerCase().includes(s));
    });

    const toggleGuest = (friend) => {
        setGuests(prev => {
            const exists = prev.find(g => (g.invitee_details?.id || g.invitee) === friend.id);
            if (exists) return prev.filter(g => (g.invitee_details?.id || g.invitee) !== friend.id);
            return [...prev, { 
                invitee: friend.id, 
                invitee_details: { id: friend.id, username: friend.username, name: friend.first_name || friend.username, email: friend.email },
                permission: 'view',
                status: 'pending' 
            }];
        });
    };

    const togglePermission = (uid) => {
        setGuests(prev => prev.map(g => 
            (g.invitee_details?.id || g.invitee) === uid 
                ? { ...g, permission: g.permission === 'view' ? 'edit' : 'view' } 
                : g
        ));
    };

    return {
        friends, guests, setGuests, showGuestPicker, setShowGuestPicker,
        guestSearch, setGuestSearch, filteredFriends, toggleGuest, togglePermission
    };
}
