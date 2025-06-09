import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useGroupContext } from "../contexts/GroupContext";
import { auth } from "../firebaseConfig";
import * as FirestoreService from "../hooks/useFirestore";
import UserSearchModal from "./userSearchModal";

export default function ViewGroup() {
  const { groupId, groupName } = useLocalSearchParams();
  const { leaveGroup, removeMember } = useGroupContext();

  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isCreator = groupDetails?.createdBy === currentUserId;

  const fetchGroupData = async () => {
    setLoadingData(true);
    try {
      const group = await FirestoreService.fetchGroupById(groupId);
      setGroupDetails(group);

      const memberDetails = await Promise.all(
        (group.members || []).map(async (memberId) => {
          try {
            const user = await FirestoreService.fetchUserById(memberId);
            return {
              id: memberId,
              name: `${user?.firstName ?? "Unknown"} ${
                user?.lastName ?? ""
              }`.trim(),
              photoURL: user?.photoURL ?? null,
            };
          } catch {
            return { id: memberId, name: "Unknown User", photoURL: null };
          }
        })
      );
      setMembers(memberDetails);

      const fetchActivities = await FirestoreService.fetchActivitiesByGroupId(
        groupId
      );
      setActivity(fetchActivities || []);
    } catch (error) {
      console.error("Error fetching group details", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchGroupData();
  }, [groupId]);

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my group "${groupName}" in the DoTogether app. Use code: ${groupId}`,
      });
    } catch {
      console.error("Error sharing group code");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const result = await leaveGroup(groupId);
      if (result.success) {
        Alert.alert("Success", "Successfully left the group");
        router.replace("/dashboard");
      } else {
        Alert.alert("Error", result.message || "Failed to leave group");
      }
    } catch {
      Alert.alert("Error", "Failed to leave group. Please try again.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const result = await removeMember(groupId, memberId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        Alert.alert("Success", "Member removed successfully");
      }
    } catch {
      Alert.alert("Error", "Failed to remove member. Please try again.");
    }
  };

  const removeMemberDesign = (member) =>
    isCreator && member.id !== currentUserId ? (
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMember(member.id)}
      >
        <Ionicons name="person-remove-outline" size={20} color="#f44336" />
      </TouchableOpacity>
    ) : null;

  // --- Updated here: close modal after updating members ---
  const handleAddUsers = async (userIds) => {
    try {
      const result = await FirestoreService.addUsersToGroup(groupId, userIds);
      if (result.success) {
        const newMembers = await Promise.all(
          userIds.map(async (uid) => {
            const data = await FirestoreService.fetchUserById(uid);
            return {
              id: uid,
              name: `${data?.firstName ?? "Unknown"} ${
                data?.lastName ?? ""
              }`.trim(),
              photoURL: data?.photoURL ?? null,
            };
          })
        );
        // 1) Append immediately
        setMembers((prev) => [...prev, ...newMembers]);

        // 2) Close the modal so you see the updated list
        setIsAddMemberModalVisible(false);

        // 3) Show success
        Alert.alert("Success", result.message);
      } else {
        console.warn("Failed to add:", result.message);
      }
    } catch (err) {
      console.error("Error adding members:", err);
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#3f51b5" />
          </TouchableOpacity>
          <Text style={styles.groupName}>{groupName}</Text>
        </View>

        {/* Description */}
        {groupDetails?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {groupDetails.description}
            </Text>
          </View>
        )}

        {/* Join Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Code</Text>
          <View style={styles.joinCodeContainer}>
            <Text style={styles.joinCodeText}>{groupId}</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareCode}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>
                Share Group Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Members ({members.length})
            </Text>
            {isCreator && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setIsAddMemberModalVisible(true)}
              >
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color="#3f51b5"
                />
                <Text style={styles.addMemberText}>Add Member</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.membersList}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  {member.photoURL ? (
                    <Image
                      source={{ uri: member.photoURL }}
                      style={styles.memberAvatarImage}
                    />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.memberName}>
                    {member.name}
                    {member.id === groupDetails?.createdBy && " (Creator)"}
                    {member.id === currentUserId && " (You)"}
                  </Text>
                </View>
                {removeMemberDesign(member)}
              </View>
            ))}
          </View>
        </View>

        {/* Leave Group */}
        {!isCreator && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
          >
            <Ionicons name="exit-outline" size={20} color="#fff" />
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <UserSearchModal
        visible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        onAddUser={handleAddUsers} // just the handler
        currentMembers={members.map((m) => m.id)}
        groupId={groupId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    groupName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 22,
    },
    joinCodeContainer:{
        marginTop: -8,
    },
    shareButton: {
        backgroundColor: '#3f51b5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    addMemberButton:{
        flexDirection: 'row',
        alignItems: 'center',
    },
    addMemberText:{
        color: '#3f51b5',
        marginLeft: 4,
        fontWeight: '600',
    },
    membersList: {
        marginTop: 8,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3f51b5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    memberInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: 16,
        color: '#333',
    },
    leaveButton: {
        backgroundColor: '#f44336',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 20,
    },
    leaveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    removeButton: {
        marginLeft: 10,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createActivityButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createActivityText: {
        color: '#3f51b5',
        marginLeft: 4,
        fontWeight: '600',
    },
    activityList: {
        marginTop: 8,
    },
    activityListContent: {
        paddingBottom: 8,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#3f51b5',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    activityDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    activityDescription: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
    participantsText: {
        fontSize: 12,
        color: '#3f51b5',
        marginTop: 6,
    },
    emptyActivitiesContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyActivitiesText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    emptyActivitiesSubtext: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },
    memberAvatarImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 10,
  backgroundColor: '#ccc',
},
    memberAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    joinCodeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3f51b5',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 1.2,
    },
    
});