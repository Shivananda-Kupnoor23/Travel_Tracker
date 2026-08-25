sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("travel.tracker.admin.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            var oDashModel = new JSONModel({
                stats: {},
                travellingToday: [],
                countryDistribution: [],
                domesticDistribution: [],
                upcomingTravel: [],
                returningToday: [],
                currentlyAbroad: [],
                calendarData: [],
                chatMessages: [],
                chatBotAvailable: false
            });
            this.setModel(oDashModel, "dash");
        }
    });
});
