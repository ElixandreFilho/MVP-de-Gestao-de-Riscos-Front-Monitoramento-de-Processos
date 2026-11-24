import { defineStore } from "pinia"

const useUserPageStore = defineStore("userPage", {
    state: () => ({
        searchQuery: "",
        loading: false,
        modalVisible: false,
        reloadUsers: false,
        pedingChanges: false,
    }),
    getters: {
        getQuery: (state) => state.searchQuery,
        isLoading: (state) => state.loading,
        isModalVisible: (state) => state.modalVisible,
        needsReload: (state) => state.reloadUsers,
        hasPendingChanges: (state) => state.pedingChanges,
    },
    actions: {
        setQuery(newQuery: string) {
            this.searchQuery = newQuery
        },
        setLoading(isLoading: boolean) {
            this.loading = isLoading
        },
        setModalVisible(isVisible: boolean) {
            this.modalVisible = isVisible
        },
        acionarReload(reloadUsers: boolean) {
            this.reloadUsers = reloadUsers
        },
        setHasPendingChanges(hasPendingChanges: boolean) {
            this.pedingChanges = hasPendingChanges
        },
    },
})

export { useUserPageStore }
