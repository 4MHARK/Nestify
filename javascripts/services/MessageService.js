class MessageService {
    static getMyMessages() {
        const user = AuthService.getCurrentUser();
        if (!user) return [];
        
        return StorageService.getMessagesForUser(user.id);
    }

    static getConversation(otherUserId) {
        const user = AuthService.getCurrentUser();
        if (!user) return [];
        
        return StorageService.getConversation(user.id, otherUserId);
    }

    static sendMessage(receiverId, content) {
        const user = AuthService.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!content || !content.trim()) {
            return { success: false, error: 'Message cannot be empty' };
        }

        const receiver = StorageService.get(STORAGE_KEYS.USERS).find(u => u.id === receiverId);
        if (!receiver) {
            return { success: false, error: 'Receiver not found' };
        }

        const message = {
            id: StorageService.generateId(),
            senderId: user.id,
            receiverId: receiverId,
            content: content.trim(),
            timestamp: new Date().toISOString(),
            read: false
        };

        if (!StorageService.saveMessage(message)) {
            return { success: false, error: 'Failed to send message' };
        }

        return { success: true, message };
    }

    static getUnreadCount() {
        const user = AuthService.getCurrentUser();
        if (!user) return 0;
        
        const messages = StorageService.getMessages();
        return messages.filter(m => m.receiverId === user.id && !m.read).length;
    }

    static markAsRead(messageId) {
        const messages = StorageService.getMessages();
        const message = messages.find(m => m.id === messageId);
        
        if (!message) {
            return { success: false, error: 'Message not found' };
        }

        const user = AuthService.getCurrentUser();
        if (message.receiverId !== user.id) {
            return { success: false, error: 'Unauthorized' };
        }

        message.read = true;
        StorageService.set(STORAGE_KEYS.MESSAGES, messages);
        
        return { success: true };
    }

    static getContacts() {
        const user = AuthService.getCurrentUser();
        if (!user) return [];
        
        const messages = StorageService.getMessagesForUser(user.id);
        const contactIds = new Set();
        
        messages.forEach(m => {
            if (m.senderId !== user.id) contactIds.add(m.senderId);
            if (m.receiverId !== user.id) contactIds.add(m.receiverId);
        });

        const users = StorageService.getUsers();
        return Array.from(contactIds).map(id => {
            const contact = users.find(u => u.id === id);
            if (!contact) return null;
            const { password, ...safeContact } = contact;
            return safeContact;
        }).filter(Boolean);
    }
}
