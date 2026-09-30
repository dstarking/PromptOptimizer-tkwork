<!-- Toast组件 - 基于Naive UI NMessageProvider -->
<template>
    <!-- Naive UI的消息提供者组件 -->
    <NMessageProvider
        placement="top-right"
        container-style="position: fixed; top: 20px; right: 20px;"
    >
        <NDialogProvider>
            <MessageApiInitializer />
            <slot />
        </NDialogProvider>
    </NMessageProvider>
</template>

<script setup lang="ts">
import { onMounted, defineComponent, h } from "vue";
import { NMessageProvider, NDialogProvider, useMessage, useDialog } from "naive-ui";

import { setGlobalMessageApi } from '../composables/ui/useToast';
import { setGlobalDialogApi } from '../composables/ui/useConfirmDialog';

// 内部组件用于在正确的上下文中初始化消息API
const MessageApiInitializer = defineComponent({
    name: "MessageApiInitializer",
    setup() {
        let messageApi: ReturnType<typeof useMessage> | null = null;
        let dialogApi: ReturnType<typeof useDialog> | null = null;

        try {
            messageApi = useMessage();
            dialogApi = useDialog();
        } catch (error) {
            console.warn(
                "[Toast] Naive UI API initialization failed (this is normal during SSR or when provider is not ready):",
                error,
            );
        }

        onMounted(() => {
            if (messageApi) {
                setGlobalMessageApi(messageApi);
                console.log("[Toast] Message API initialized successfully");
            }
            if (dialogApi) {
                setGlobalDialogApi(dialogApi);
                console.log("[Toast] Dialog API initialized successfully");
            }
        });
        return () => h("div", { style: { display: "none" } });
    },
});
</script>
