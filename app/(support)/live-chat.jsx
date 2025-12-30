import { useTheme } from '@/contexts/theme-context';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveChatScreen() {
    const { colors, fonts, isDark } = useTheme();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [messageId, setMessageId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const flatListRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // Listen to keyboard events to scroll to bottom
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    // Fetch message ID on mount
    useFocusEffect(
        useCallback(() => {
            fetchMessageId();
            
            return () => {
                // Clear polling interval when screen loses focus
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }, [])
    );

    const fetchMessageId = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/get-message-id');
            
            if (response) {
                setMessageId(response);
                await fetchConversation(response);
                
                // Start polling for new messages every 5 seconds
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
                pollIntervalRef.current = setInterval(() => {
                    fetchConversation(response, true);
                }, 5000);
            }
        } catch (error) {
            console.error('Error fetching message ID:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConversation = async (msgId, shouldScroll = true) => {
        try {
            const id = msgId || messageId;
            if (!id) return;
            
            const response = await api.get(`/messages/${id}`);
            
            if (Array.isArray(response)) {
                // Transform API response to match our message format
                const transformedMessages = response.map(msg => ({
                    id: msg.id,
                    text: msg.reply,
                    sender: msg.replyby === 'ADMIN' ? 'support' : 'user',
                    time: formatTime(msg.created_at),
                    imageUrl: msg.image_url,
                    replyBy: msg.replyby
                }));
                
                const prevLength = messages.length;
                setMessages(transformedMessages);
                
                // Scroll to bottom after messages load (only if new messages or initial load)
                if (shouldScroll && (prevLength === 0 || transformedMessages.length > prevLength)) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                }
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant permission to access your photos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleSend = async () => {
        if ((!message.trim() && !selectedImage) || !messageId || isSending) return;

        setIsSending(true);
        const messageText = message.trim();
        const imageToSend = selectedImage;
        setMessage('');
        setSelectedImage(null);

        try {
            if (imageToSend) {
                // Send with image using FormData
                const formData = new FormData();
                if (messageText) {
                    formData.append('replyContent', messageText);
                }
                
                const imageUri = imageToSend.uri;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                
                formData.append('image', {
                    uri: imageUri,
                    name: filename,
                    type: type,
                });

                const response = await api.postFormData(`/reply/${messageId}`, formData);
                
                if (response.success) {
                    await fetchConversation(messageId);
                }
            } else {
                // Send text only
                const response = await api.post(`/reply/${messageId}`, {
                    replyContent: messageText
                });

                if (response.success) {
                    await fetchConversation(messageId);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Restore message on error
            setMessage(messageText);
            setSelectedImage(imageToSend);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.supportMessage
            ]}>
                <View style={[
                    styles.messageBubble,
                    {
                        backgroundColor: isUser ? colors.primary : (isDark ? '#1f1f1f' : '#f5f5f5')
                    }
                ]}>
                    <Text style={[
                        styles.messageText,
                        {
                            color: isUser ? '#fff' : colors.text,
                            fontFamily: fonts.inter.regular
                        }
                    ]}>
                        {item.text}
                    </Text>
                    {item.imageUrl && (
                        <Image 
                            source={{ uri: item.imageUrl }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    )}
                    <Text style={[
                        styles.messageTime,
                        {
                            color: isUser ? '#fff' : colors.icon,
                            fontFamily: fonts.inter.regular
                        }
                    ]}>
                        {item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.inter.bold }]}>
                            Support Chat
                        </Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.statusText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                                Online
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 24 }} />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.icon, fontFamily: fonts.inter.regular }]}>
                            Loading conversation...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                        }}
                        onLayout={() => {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: false });
                            }, 100);
                        }}
                        keyboardDismissMode="interactive"
                        keyboardShouldPersistTaps="handled"
                        maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                        }}
                    />
                )}

                <View style={[styles.inputWrapper, { backgroundColor: colors.background }]}>
                    {selectedImage && (
                        <View style={[styles.imagePreviewContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                            <Image 
                                source={{ uri: selectedImage.uri }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                            />
                            <TouchableOpacity 
                                style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
                        <TouchableOpacity
                            style={styles.attachButton}
                            onPress={pickImage}
                            disabled={isSending}
                        >
                            <Ionicons name="image-outline" size={24} color={colors.icon} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.input, { color: colors.text, fontFamily: fonts.inter.regular }]}
                            placeholder="Type your message..."
                            placeholderTextColor={colors.icon}
                            value={message}
                            onChangeText={setMessage}
                            onFocus={() => {
                                setTimeout(() => {
                                    flatListRef.current?.scrollToEnd({ animated: true });
                                }, 300);
                            }}
                            multiline
                            editable={!isSending}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton, 
                                { 
                                    backgroundColor: colors.primary,
                                    opacity: (isSending || (!message.trim() && !selectedImage)) ? 0.5 : 1
                                }
                            ]}
                            onPress={handleSend}
                            disabled={isSending || (!message.trim() && !selectedImage)}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, marginBottom: 4 },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: { fontSize: 12 },
    messagesList: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    messageContainer: {
        marginBottom: 16,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    supportMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 11,
        opacity: 0.7,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    inputWrapper: {
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    imagePreviewContainer: {
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 12,
    },
    attachButton: {
        padding: 4,
    },
    input: {
        flex: 1,
        fontSize: 14,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
