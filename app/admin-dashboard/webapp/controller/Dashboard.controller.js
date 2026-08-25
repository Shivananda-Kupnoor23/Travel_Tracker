sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment) {
    "use strict";

    var CHATBOT_URL = "http://localhost:5000";

    return Controller.extend("travel.tracker.admin.controller.Dashboard", {

        onInit: function () {
            this._oDashModel = this.getOwnerComponent().getModel("dash");

            this._oDashModel.setProperty("/selectedDateInfo", {
                date: "", travelling: 0, returning: 0, departing: 0
            });
            this._oDashModel.setProperty("/filteredTravels", []);
            this._oDashModel.setProperty("/chatMessages", [{
                type: "bot",
                text: "Hi! I'm your Travel Intelligence Assistant. Ask me anything about company travel — who is travelling, where, when, department breakdowns, or any question you have!",
                timestamp: new Date().toLocaleTimeString()
            }]);

            this.getOwnerComponent().getRouter()
                .getRoute("Dashboard")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadDashboardData();
            this._checkChatbotHealth();
        },

        // =================== DATA LOADING ===================

        _loadDashboardData: function () {
            var that = this;

            // Load stats
            jQuery.ajax({
                url: "/travel/getDashboardStats()",
                success: function (data) {
                    that._oDashModel.setProperty("/stats", data);
                }
            });

            // Load travelling today
            jQuery.ajax({
                url: "/travel/getTravellingToday()",
                success: function (data) {
                    var travels = data.value || [];
                    that._oDashModel.setProperty("/travellingToday", travels);
                    that._oDashModel.setProperty("/filteredTravels", travels);
                }
            });

            // Load country distribution
            jQuery.ajax({
                url: "/travel/getCountryDistribution()",
                success: function (data) {
                    var dist = data.value || [];
                    that._oDashModel.setProperty("/countryDistribution", dist);
                    that._populateCountryFilter(dist);
                    // Update chart
                    setTimeout(function () { that._setupChart(); }, 500);
                }
            });

            // Load domestic distribution
            jQuery.ajax({
                url: "/travel/getDomesticDistribution()",
                success: function (data) {
                    that._oDashModel.setProperty("/domesticDistribution", data.value || []);
                }
            });

            // Load calendar data for current month
            var now = new Date();
            jQuery.ajax({
                url: "/travel/getCalendarData(year=" + now.getFullYear() + ",month=" + (now.getMonth() + 1) + ")",
                success: function (data) {
                    that._oDashModel.setProperty("/calendarData", data.value || []);
                }
            });
        },

        _populateCountryFilter: function (aCountries) {
            var oSelect = this.byId("countryFilter");
            // Keep the first "All Countries" item
            while (oSelect.getItems().length > 1) {
                oSelect.removeItem(oSelect.getItems()[1]);
            }
            aCountries.forEach(function (c) {
                oSelect.addItem(new sap.ui.core.Item({
                    key: c.country,
                    text: c.country + " (" + c.count + ")"
                }));
            });
        },

        _setupChart: function () {
            var oChart = this.byId("countryChart");
            if (oChart) {
                oChart.setVizProperties({
                    title: { visible: false },
                    plotArea: {
                        dataLabel: { visible: true },
                        colorPalette: ["#1B7FC3", "#2B9ADE", "#5BB7E8", "#8DD0F2", "#B8E2F8", "#D4EEFB"]
                    },
                    categoryAxis: { title: { visible: false } },
                    valueAxis: { title: { visible: false } }
                });
            }
        },

        // =================== FILTERS ===================

        onFilterChange: function () {
            var sType = this.byId("typeFilter").getSelectedKey();
            var sCountry = this.byId("countryFilter").getSelectedKey();
            var sDept = this.byId("deptFilter").getSelectedKey();
            var sStatus = this.byId("statusFilter").getSelectedKey();
            var sSearch = this.byId("searchField").getValue().toLowerCase();

            var aTravels = this._oDashModel.getProperty("/travellingToday") || [];

            var aFiltered = aTravels.filter(function (t) {
                if (sType && sType !== "All" && t.travelType !== sType) return false;
                if (sCountry && t.toCountry !== sCountry) return false;
                if (sDept && t.employee && t.employee.department !== sDept) return false;
                if (sStatus && t.status !== sStatus) return false;
                if (sSearch && t.employee && t.employee.name.toLowerCase().indexOf(sSearch) === -1) return false;
                return true;
            });

            this._oDashModel.setProperty("/filteredTravels", aFiltered);
        },

        // =================== TILE ACTIONS ===================

        onTileTravellingToday: function () {
            this.byId("typeFilter").setSelectedKey("All");
            this.onFilterChange();
        },

        onTileAbroad: function () {
            this.byId("typeFilter").setSelectedKey("International");
            this.onFilterChange();
        },

        // =================== CALENDAR ===================

        onDateSelect: function (oEvent) {
            var oCalendar = oEvent.getSource();
            var aSelectedDates = oCalendar.getSelectedDates();
            if (aSelectedDates.length === 0) return;

            var oDate = aSelectedDates[0].getStartDate();
            var sDate = oDate.toISOString().split('T')[0];
            var aCalData = this._oDashModel.getProperty("/calendarData") || [];

            var oMatch = aCalData.find(function (d) { return d.date === sDate; });

            this._oDashModel.setProperty("/selectedDateInfo", {
                date: sDate,
                travelling: oMatch ? oMatch.travelling : 0,
                returning: oMatch ? oMatch.returning : 0,
                departing: oMatch ? oMatch.departing : 0
            });
        },

        // =================== WORLD MAP ===================

        onMapRendered: function () {
            var that = this;
            setTimeout(function () { that._renderWorldMap(); }, 1000);
        },

        _renderWorldMap: function () {
            var oContainer = document.getElementById("worldMapSvg");
            if (!oContainer) return;

            var aCountries = this._oDashModel.getProperty("/countryDistribution") || [];
            if (aCountries.length === 0) return;

            // Country coordinates (approximate positions on a simple world map)
            var countryPositions = {
                "USA": { x: 20, y: 35, label: "USA" },
                "UK": { x: 45, y: 25, label: "UK" },
                "Germany": { x: 50, y: 28, label: "Germany" },
                "UAE": { x: 58, y: 42, label: "UAE" },
                "India": { x: 65, y: 42, label: "India" },
                "Singapore": { x: 72, y: 55, label: "Singapore" },
                "Japan": { x: 82, y: 32, label: "Japan" },
                "Australia": { x: 80, y: 72, label: "Australia" },
                "China": { x: 75, y: 35, label: "China" },
                "France": { x: 47, y: 30, label: "France" },
                "Canada": { x: 18, y: 22, label: "Canada" },
                "Brazil": { x: 30, y: 60, label: "Brazil" }
            };

            var html = '<svg viewBox="0 0 100 85" style="width:100%;height:100%">';

            // Simple world background
            html += '<rect width="100" height="85" fill="#e8f4f8" rx="2"/>';

            // Simplified continent outlines
            html += '<ellipse cx="22" cy="35" rx="14" ry="18" fill="#d4e6d9" stroke="#aac" stroke-width="0.3" opacity="0.7"/>'; // Americas
            html += '<ellipse cx="48" cy="32" rx="10" ry="14" fill="#d4e6d9" stroke="#aac" stroke-width="0.3" opacity="0.7"/>'; // Europe
            html += '<ellipse cx="55" cy="45" rx="8" ry="12" fill="#d4e6d9" stroke="#aac" stroke-width="0.3" opacity="0.7"/>'; // Africa
            html += '<ellipse cx="70" cy="38" rx="15" ry="16" fill="#d4e6d9" stroke="#aac" stroke-width="0.3" opacity="0.7"/>'; // Asia
            html += '<ellipse cx="80" cy="68" rx="8" ry="7" fill="#d4e6d9" stroke="#aac" stroke-width="0.3" opacity="0.7"/>'; // Australia

            // India marker (home)
            html += '<circle cx="65" cy="42" r="1.5" fill="#2196F3" stroke="#fff" stroke-width="0.3"/>';
            html += '<text x="65" y="46" text-anchor="middle" font-size="2.5" fill="#2196F3" font-weight="bold">India (Home)</text>';

            // Country markers with counts
            var that = this;
            aCountries.forEach(function (c) {
                var pos = countryPositions[c.country];
                if (!pos) return;

                var radius = Math.min(3, 1 + c.count * 0.4);
                var color = "#E53935";

                html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + radius + '" fill="' + color + '" opacity="0.8" stroke="#fff" stroke-width="0.3" style="cursor:pointer" onclick="document.dispatchEvent(new CustomEvent(\'mapCountryClick\', {detail:\'' + c.country + '\'}))" />';
                html += '<text x="' + pos.x + '" y="' + (pos.y + radius + 2.5) + '" text-anchor="middle" font-size="2.2" fill="#333" font-weight="bold">' + pos.label + ' (' + c.count + ')</text>';

                // Dotted line from India to country
                html += '<line x1="65" y1="42" x2="' + pos.x + '" y2="' + pos.y + '" stroke="#999" stroke-width="0.2" stroke-dasharray="1,0.5" opacity="0.5"/>';
            });

            html += '</svg>';

            oContainer.innerHTML = html;

            // Listen for map click events
            document.addEventListener('mapCountryClick', function (e) {
                that.getOwnerComponent().getRouter().navTo("CountryDetail", { country: e.detail });
            });
        },

        // =================== TABLE ACTIONS ===================

        onCountryPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("dash");
            var sCountry = oCtx.getProperty("toCountry");
            if (sCountry && sCountry !== "India") {
                this.getOwnerComponent().getRouter().navTo("CountryDetail", { country: sCountry });
            }
        },

        onApprove: function (oEvent) {
            var that = this;
            var oCtx = oEvent.getSource().getBindingContext("dash");
            var sTravelId = oCtx.getProperty("ID");

            jQuery.ajax({
                url: "/travel/approveTravel",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ travelId: sTravelId }),
                success: function () {
                    MessageToast.show("Travel approved!");
                    that._loadDashboardData();
                },
                error: function () {
                    MessageBox.error("Error approving travel");
                }
            });
        },

        onReject: function (oEvent) {
            var that = this;
            var oCtx = oEvent.getSource().getBindingContext("dash");
            var sTravelId = oCtx.getProperty("ID");

            MessageBox.confirm("Reject this travel request?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        jQuery.ajax({
                            url: "/travel/rejectTravel",
                            method: "POST",
                            contentType: "application/json",
                            data: JSON.stringify({ travelId: sTravelId }),
                            success: function () {
                                MessageToast.show("Travel rejected");
                                that._loadDashboardData();
                            },
                            error: function () {
                                MessageBox.error("Error rejecting travel");
                            }
                        });
                    }
                }
            });
        },

        onRefresh: function () {
            this._loadDashboardData();
            MessageToast.show("Dashboard refreshed");
        },

        // =================== CHATBOT ===================

        _checkChatbotHealth: function () {
            var that = this;
            jQuery.ajax({
                url: CHATBOT_URL + "/api/health",
                timeout: 3000,
                success: function (data) {
                    that._oDashModel.setProperty("/chatBotAvailable", data.api_key_configured && data.db_available);
                },
                error: function () {
                    that._oDashModel.setProperty("/chatBotAvailable", false);
                }
            });
        },

        onOpenChatbot: function () {
            var that = this;
            if (!this._oChatPopover) {
                Fragment.load({
                    name: "travel.tracker.admin.fragment.Chatbot",
                    controller: this
                }).then(function (oPopover) {
                    that._oChatPopover = oPopover;
                    that.getView().addDependent(oPopover);
                    oPopover.openBy(that.byId("chatbotBtn"));
                });
            } else {
                if (this._oChatPopover.isOpen()) {
                    this._oChatPopover.close();
                } else {
                    this._oChatPopover.openBy(this.byId("chatbotBtn"));
                }
            }
        },

        onSendChat: function () {
            var oInput = sap.ui.getCore().byId("chatInput");
            if (!oInput) return;

            var sQuestion = oInput.getValue().trim();
            if (!sQuestion) return;

            oInput.setValue("");
            this._sendChatMessage(sQuestion);
        },

        onChatInputSubmit: function (oEvent) {
            this.onSendChat();
        },

        onSuggestionClick: function (oEvent) {
            var sQuestion = oEvent.getSource().getText();
            this._sendChatMessage(sQuestion);
        },

        _sendChatMessage: function (sQuestion) {
            var that = this;
            var aMessages = this._oDashModel.getProperty("/chatMessages") || [];

            // Add user message
            aMessages.push({
                type: "user",
                text: sQuestion,
                timestamp: new Date().toLocaleTimeString()
            });
            this._oDashModel.setProperty("/chatMessages", aMessages.slice());

            // Add loading indicator
            aMessages.push({
                type: "bot",
                text: "Thinking...",
                timestamp: "",
                loading: true
            });
            this._oDashModel.setProperty("/chatMessages", aMessages.slice());

            jQuery.ajax({
                url: CHATBOT_URL + "/api/chat",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ question: sQuestion }),
                timeout: 30000,
                success: function (data) {
                    // Remove loading message
                    aMessages = that._oDashModel.getProperty("/chatMessages").filter(function (m) { return !m.loading; });

                    var sAnswer = data.answer || "No response received.";

                    // Format data as table if available
                    if (data.data && data.data.length > 0) {
                        sAnswer += "\n\n";
                        var aKeys = Object.keys(data.data[0]).filter(function (k) {
                            return k !== "createdAt" && k !== "modifiedAt" && k !== "createdBy" && k !== "modifiedBy";
                        });

                        // Take first 5 visible columns max
                        var aVisibleKeys = aKeys.slice(0, 6);
                        data.data.slice(0, 10).forEach(function (row, i) {
                            var sRow = (i + 1) + ". ";
                            aVisibleKeys.forEach(function (k) {
                                if (row[k] !== null && row[k] !== undefined && row[k] !== "") {
                                    sRow += k + ": " + row[k] + " | ";
                                }
                            });
                            sAnswer += sRow.replace(/ \| $/, "") + "\n";
                        });
                        if (data.data.length > 10) {
                            sAnswer += "... and " + (data.data.length - 10) + " more rows";
                        }
                    }

                    aMessages.push({
                        type: "bot",
                        text: sAnswer,
                        timestamp: new Date().toLocaleTimeString()
                    });
                    that._oDashModel.setProperty("/chatMessages", aMessages.slice());
                    that._scrollChatToBottom();
                },
                error: function (xhr) {
                    aMessages = that._oDashModel.getProperty("/chatMessages").filter(function (m) { return !m.loading; });
                    var sError = "Sorry, I'm unable to connect. Make sure the chatbot server is running on port 5000.";
                    if (xhr.responseJSON && xhr.responseJSON.answer) {
                        sError = xhr.responseJSON.answer;
                    }
                    aMessages.push({
                        type: "bot",
                        text: sError,
                        timestamp: new Date().toLocaleTimeString()
                    });
                    that._oDashModel.setProperty("/chatMessages", aMessages.slice());
                }
            });
        },

        onClearChat: function () {
            this._oDashModel.setProperty("/chatMessages", [{
                type: "bot",
                text: "Chat cleared. Ask me anything about company travel!",
                timestamp: new Date().toLocaleTimeString()
            }]);

            jQuery.ajax({
                url: CHATBOT_URL + "/api/chat/clear",
                method: "POST"
            });
        },

        _scrollChatToBottom: function () {
            setTimeout(function () {
                var oList = sap.ui.getCore().byId("chatMessageList");
                if (oList) {
                    var aItems = oList.getItems();
                    if (aItems.length > 0) {
                        oList.scrollToIndex(aItems.length - 1);
                    }
                }
            }, 200);
        }
    });
});
