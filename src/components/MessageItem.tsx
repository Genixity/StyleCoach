import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  TextStyle,
} from "react-native";
import { useTheme } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';

interface SelectedImage {
  uri: string;
  aspectRatio: number;
}

interface Message {
  _id: string;
  text: string;
  createdAt: number;
  user: {
    _id: number;
    name: string;
  };
  images?: SelectedImage[];
}

interface MessageItemProps {
  item: Message;
  index: number;
  openFullImage: (uri: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ item, index, openFullImage }) => {
  const { colors } = useTheme();
  const isMyMessage = item.user._id === 2;
  const totalImages = item.images ? item.images.length : 0;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, index]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  // Definice stylů pro Markdown pomocí StyleSheet.create
  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      color: isMyMessage ? '#FAF9F6' : colors.onSurface,
      lineHeight: 22,
    } as TextStyle,
    heading1: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    } as TextStyle,
    heading2: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 6,
    } as TextStyle,
    heading3: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    } as TextStyle,
    heading4: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    } as TextStyle,
    heading5: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    } as TextStyle,
    heading6: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    } as TextStyle,
    hr: {
      borderBottomColor: colors.outline,
      borderBottomWidth: StyleSheet.hairlineWidth,
      marginVertical: 8,
    },
    strong: {
      fontWeight: 'bold',
      color: isMyMessage ? '#FAF9F6' : colors.onSurface,
    } as TextStyle,
    em: {
      fontStyle: 'italic',
      color: isMyMessage ? '#FAF9F6' : colors.onSurface,
    } as TextStyle,
    s: {
      textDecorationLine: 'line-through',
      color: colors.outline,
    } as TextStyle,
    blockquote: {
      borderLeftColor: colors.onSurfaceVariant,
      borderLeftWidth: 4,
      borderTopEndRadius: 8,
      borderBottomEndRadius: 8,
      paddingLeft: 8,
      color: colors.onSurface,
      backgroundColor: colors.outline,
      fontStyle: 'italic',
    } as TextStyle,
    list_item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    ordered_list_icon: {
      width: 20,
      textAlign: 'right',
      marginRight: 8,
      color: colors.onSurface,
      fontSize: 16,
    },
    bullet_list_icon: {
      width: 20,
      textAlign: 'right',
      marginRight: 8,
      color: colors.onSurface,
      fontSize: 16,
    },
    code_inline: {
      backgroundColor: colors.outline,
      color: colors.onSurface,
    } as TextStyle,
    code_block: {
      backgroundColor: colors.outline,
      color: colors.onSurface,
    } as TextStyle,
    fence: {
      backgroundColor: colors.outline,
      color: colors.onSurface,
    } as TextStyle,
    table: {
      borderWidth: 2,
      borderColor: colors.outline, // Nahrazení 'disabled' za 'outline'
      borderRadius: 4,
      overflow: 'hidden',
    },
    thead: {
      backgroundColor: colors.primary, // Nahrazení 'disabled' za 'outline'
    },
    tbody: {},
    th: {
      padding: 6,
      fontWeight: '600',
      color: colors.onSurface,
      textAlign: 'left',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    } as TextStyle,
    tr: {},
    td: {
      padding: 6,
      color: colors.onSurface,
      textAlign: 'left',
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    } as TextStyle,
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    } as TextStyle,
    blocklink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    } as TextStyle,
    image: {
      width: '100%',
      height: 200,
      resizeMode: 'cover',
      borderRadius: 8,
      marginVertical: 8,
    },
    text: {
      color: isMyMessage ? '#FAF9F6' : colors.onSurface,
    } as TextStyle,
    textgroup: {},
    paragraph: {
      marginBottom: 8,
    },
    hardbreak: {
      height: 8,
    },
    softbreak: {
      height: 8,
    },
    pre: {
      backgroundColor: colors.outline, // Nahrazení 'disabled' za 'outline'
      padding: 12,
      borderRadius: 6,
      fontFamily: 'Courier',
      color: colors.onSurface,
      overflow: 'hidden',
    } as TextStyle,
    inline: {},
    span: {},
  });

  return (
    <Animated.View
      style={{ marginBottom: 10, transform: [{ translateY }], opacity: animatedValue }}
    >
      {item.images && totalImages > 0 && (
        <View
          style={[
            styles.imageContainer,
            isMyMessage ? styles.myImageContainer : styles.botImageContainer,
            styles.shadowStyle,
          ]}
        >
          {renderImages(item.images, totalImages, openFullImage, colors)}
        </View>
      )}
      {item.text !== '' && (
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.botMessage,
            { backgroundColor: isMyMessage ? colors.primary : colors.surface },
            styles.shadowStyle,
          ]}
        >
          <Markdown
            style={markdownStyles}
            onLinkPress={(url) => {
              Linking.openURL(url).catch((err) =>
                console.error("Failed to open URL:", err)
              );
              return true;
            }}
          >
            {item.text}
          </Markdown>
        </View>
      )}
    </Animated.View>
  );
};

const renderImages = (
  images: SelectedImage[],
  totalImages: number,
  openFullImage: (uri: string) => void,
  colors: any
) => {
  const screenWidth = Dimensions.get('window').width;
  const maxImageHeight = 250;

  if (totalImages === 1) {
    const image = images[0];
    const imageAspectRatio = image.aspectRatio;
    let width = screenWidth * 0.8;
    let height = width / imageAspectRatio;

    if (height > maxImageHeight) {
      height = maxImageHeight;
      width = height * imageAspectRatio;
    }

    return (
      <View style={{ alignItems: 'flex-end' }}>
        <TouchableOpacity onPress={() => openFullImage(image.uri)}>
          <Image
            source={{ uri: image.uri }}
            style={{ width, height, borderRadius: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  } else {
    const imagesPerRow = totalImages === 4 ? 2 : totalImages;
    const imageWidth =
      (screenWidth * 0.66 - (imagesPerRow - 1) * 4 - 10) / imagesPerRow;

    return (
      <View style={[styles.imageRow, { justifyContent: 'flex-end' }]}>
        {[...images]
          .reverse() // Obrátí pořadí obrázků
          .map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openFullImage(image.uri)}
            >
              <Image
                source={{ uri: image.uri }}
                style={{
                  width: imageWidth,
                  height: imageWidth,
                  borderRadius: 8,
                  margin: 2,
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  imageContainer: {
    marginBottom: 5,
  },
  myImageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  botImageContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    marginLeft: 50,
    borderRadius: 16,
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginRight: 50,
    borderRadius: 16,
  },
  shadowStyle: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
});

export default React.memo(MessageItem);