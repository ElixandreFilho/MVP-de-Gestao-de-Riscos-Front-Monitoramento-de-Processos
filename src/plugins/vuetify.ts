import { createVuetify } from "vuetify"
import "vuetify/styles"
import { h } from "vue"
import type { Component } from "vue"
import { tablerIconsAliases } from "./tablerAliases"
import * as TablerIcons from "@tabler/icons-vue"
import { pt } from "vuetify/locale"

type PrefixedNames = keyof typeof TablerIcons
type RemoveIconPrefix<T> = T extends `Icon${infer R}` ? R : T
export type TablerIconNames = RemoveIconPrefix<PrefixedNames>

export default createVuetify({
    theme: {
        defaultTheme: "light",
        themes: {
            light: {
                colors: {
                    primary: "#274675",
                },
            },
        },
    },
    locale: {
        locale: "pt",
        messages: { pt },
    },
    defaults: {
        VBtn: {
            rounded: "lg",
            variant: "flat",
            color: "primary",
            minWidth: "auto",
        },
        VCard: {
            variant: "flat",
            class: "vcard",
        },
        VTextField: {
            rounded: "lg",
            variant: "outlined",
            class: "vtextfield",
        },
        VDataTable: {
            class: "vdatatable",
        },
        VDataTableServer: {
            class: "vdatatable",
        },
        VList: {
            rounded: "lg",
        },
        VSelect: {
            rounded: "lg",
            variant: "outlined",
        },
        VTextarea: {
            rounded: "lg",
            rows: 3,
        },
    },
    icons: {
        defaultSet: "tabler",
        aliases: tablerIconsAliases,
        sets: {
            tabler: {
                component: (props) => {
                    const iconAlias =
                        tablerIconsAliases[props.icon as keyof typeof tablerIconsAliases] ||
                        props.icon
                    const iconName = `Icon${iconAlias}`
                    const IconComponent = TablerIcons[iconName as keyof typeof TablerIcons]

                    if (!IconComponent) {
                        console.warn(`Tabler icon not found: ${iconName}`)
                        return h(
                            "span",
                            {
                                style: "font-size:12px;color:red",
                            },
                            `?${props.icon}?`
                        )
                    }

                    return h(IconComponent as Component)
                },
            },
        },
    },
})