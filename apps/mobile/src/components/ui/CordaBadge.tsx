import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CordaBadgeProps {
    graduacao: string;
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    // Props de cores granulares da API
    colorLeft?: string;
    colorRight?: string;
    pontaLeft?: string;
    pontaRight?: string;
}

// Componente para simular a textura trançada da corda
const RopeTexture = () => (
    <View style={StyleSheet.absoluteFill}>
        {/* Linhas diagonais para efeito de trança */}
        {[...Array(15)].map((_, i) => (
            <View
                key={i}
                style={{
                    position: 'absolute',
                    left: i * 6 - 20,
                    top: -20,
                    width: 1,
                    height: 80,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    transform: [{ rotate: '45deg' }]
                }}
            />
        ))}
    </View>
);

// Componente para o nó/ponta
const KnotEnd = ({ side, color }: { side: 'left' | 'right', color: string }) => (
    <View style={{
        position: 'absolute',
        [side]: -5,
        top: 0,
        bottom: 0,
        width: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    }}>
        {/* Camada base do nó */}
        <View style={{
            width: 8,
            height: '110%',
            backgroundColor: color,
            borderRadius: 3,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            transform: [{ rotate: side === 'left' ? '-10deg' : '10deg' }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            elevation: 1,
            overflow: 'hidden'
        }}>
            <View style={{ position: 'absolute', top: 3, width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.15)' }} />
            <View style={{ position: 'absolute', bottom: 3, width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.15)' }} />
        </View>

        {/* Fios soltos */}
        <View style={{
            position: 'absolute',
            [side]: -3,
            width: 5,
            height: 5,
            backgroundColor: color,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
        }} />
    </View>
);

export function CordaBadge({ graduacao, size = 'medium', showText = false, colorLeft, colorRight, pontaLeft, pontaRight }: CordaBadgeProps) {
    const sizes = {
        small: { width: 36, height: 10 },
        medium: { width: 56, height: 14 },
        large: { width: 76, height: 18 }
    };

    const { width, height } = sizes[size];

    // Lógica correta de cores
    const cLeft = colorLeft || '#E5E7EB';
    // Se colorRight não existe, assume que é igual a esquerda (Unica)
    const cRight = colorRight || cLeft;

    // É única visualmente se as cores forem iguais
    const isSingleColor = cLeft === cRight;

    // Pontas herdam do lado respectivo se não definidas explicitamente
    const pLeft = pontaLeft || cLeft;
    const pRight = pontaRight || cRight;

    return (
        <View style={styles.container}>
            {/* Wrapper da Corda */}
            <View style={{ width: width + 10, height, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 }}>

                {/* Corpo da Corda */}
                <View style={[styles.ropeBody, { height }]}>
                    {isSingleColor ? (
                        /* Única: 100% da largura */
                        <View style={{ flex: 1, backgroundColor: cLeft, height: '100%', overflow: 'hidden' }}>
                            <RopeTexture />
                        </View>
                    ) : (
                        /* Dupla: 50% cada lado */
                        <>
                            <View style={{ flex: 1, backgroundColor: cLeft, height: '100%', overflow: 'hidden' }}>
                                <RopeTexture />
                            </View>
                            <View style={{ flex: 1, backgroundColor: cRight, height: '100%', overflow: 'hidden' }}>
                                <RopeTexture />
                            </View>
                        </>
                    )}
                </View>

                {/* Nós nas pontas */}
                <KnotEnd side="left" color={pLeft} />
                <KnotEnd side="right" color={pRight} />
            </View>

            {/* Texto da Graduação */}
            {showText && <Text style={styles.text}>{graduacao}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ropeBody: {
        width: '100%',
        borderRadius: 4,
        flexDirection: 'row', // Para suportar duas cores lado a lado
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1
    },
    text: {
        marginLeft: 12,
        fontWeight: '600',
        color: '#374151',
        fontSize: 14,
        textTransform: 'capitalize'
    }
});
