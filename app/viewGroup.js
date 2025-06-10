import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useGroupContext } from "../contexts/GroupContext";
import { useUserLists } from "../contexts/UserListsContext";
import { useVotesContext } from "../contexts/VotesContext";
import { auth } from "../firebaseConfig";
import * as FirestoreService from "../hooks/useFirestore";
 
import PlacesListGenerator from "./PlacesListGenerator";
import TMDBListGenerator from "./tmdbListGenerator";
import UserSearchModal from "./userSearchModal";
import VotingSessionModal from "./votingSessionModal";
 
export default function ViewGroup() {
  const { groupId, groupName } = useLocalSearchParams();
  const { leaveGroup, removeMember } = useGroupContext();
  const { createTMDBList } = useUserLists();
  const {votes} = useVotesContext();
 
  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [votingSessions, setVotingSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isTMDBModalVisible, setIsTMDBModalVisible] = useState(false);
  const [isVotingSessionModalVisible, setIsVotingSessionModalVisible] = useState(false);
  const [isPlacesModalVisible, setIsPlacesModalVisible] = useState(false);
 
  const currentUserId = auth.currentUser?.uid;
  const isCreator = groupDetails?.createdBy === currentUserId;
 
 
    //function to fetch group details and member information
    const fetchGroupData = async() =>{
        setLoadingData(true);
 
        try{
            //check that the group exisits
            const group = await FirestoreService.fetchGroupById(groupId);
            setGroupDetails(group);
 
            //Fetch member details
            const memberDetails = await Promise.all(
                (group.members || []).map(async(memberId) =>{
                    try{
                        const user = await FirestoreService.fetchUserById(memberId);
                        return {id: memberId, 
                          name: user?.name || `${user?.firstName || 'Unknown'} ${user?.lastName || 'User'}`,
                          photoURL: user?.photoURL || null
                        };
                    }catch(error){
                        console.log("Error fetching member", error);
                        return {id: memberId, name: 'Unknown User', photoURL: null};
                    }
                })
            );
 
            setMembers(memberDetails);
 
            const fetchVotingSessions = await FirestoreService.fetchVotingSessionsByGroup(groupId);
            setVotingSessions(fetchVotingSessions || []);
        }catch(error){
            console.log("Error fetching group details", error);
        }finally{
            setLoadingData(false);
        }
    };

    useEffect(() => {
      if(votingSessions.length > 0 && votes){
        const updatedSessions = votingSessions.map(session => {
          const sessionVotes = votes.filter(
            vote => vote.activityId.startWith(`${session.id}`)
          );
          return {
            ...session,
            calculatedVoteCount: sessionVotes.length
          };
      });
      setVotingSessions(updatedSessions);
      }
    }, [votes]);
 
    useEffect(()=>{
        if(groupId){
            fetchGroupData();
        }
    }, [groupId]);
 
    //this is the share code so that people can share links through email etc
    const handleShareCode = async () =>{
        try{
            await Share.share({
                message: `Join my group "${groupName}" in the DoTogether app. Use code: ${groupId}`,
            });
        }catch(error){
            console.error("Error, could not share the group code", error);
        }
    };
 
    //this is to leave the group as long as you aren't the creator
    const handleLeaveGroup = async () =>{
        try {
            const result = await leaveGroup(groupId);
 
            if (result.success) {
                Alert.alert("Success", "Successfully left the group");
                router.replace("/dashboard");
            } else {
                Alert.alert("Error", result.message || "Failed to leave group");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave group. Please try again.");
        }
    };
 
      const handleRemoveMember = async (memberId) => {
    try {
      const result = await removeMember(groupId, memberId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        Alert.alert("Success", "Member removed successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to remove member");
      }
    } catch (error) {
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
 
  const handleAddUsers = async (userIds) => {
    try {
      const result = await FirestoreService.addUsersToGroup(groupId, userIds);
      if (result.success) {
        Alert.alert("Success", result.message);
        await fetchGroupData();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error adding members", error);
    }
  };
 
  const handleCreateVotingSession = () => {
    setIsVotingSessionModalVisible(true);
  };

  
  const handleTMDBListCreated = async () => {
    try {
      await fetchGroupData();
      setIsTMDBModalVisible(false);
      console.log("Success. Watchlist created");
    } catch (error) {
      console.error("Error handling TMDB list creation:", error);
    }
  };
 
  const handleVotingSessionCreated = async () => {
    try {
      await fetchGroupData();
      setIsVotingSessionModalVisible(false);
      console.log("Success. Voting session created");
    } catch (error) {
      console.error("Error handling voting session creation:", error);
    }
  };
  if (loadingData) {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress = {()=> router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#3f51b5" />
                    </TouchableOpacity>
                    <Text style={styles.groupName}>{groupName}</Text>
                </View>

                {/*Group Description */}
                {groupDetails?.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{groupDetails.description}</Text>
                    </View>
                )}

                {/* Share Code Button */}
                {groupId && (  // Changed from joinCode to joinId
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Join Code</Text>
                        <View style={styles.joinCodeContainer}>
                            <Text style={styles.joinCodeText}>{groupId}</Text>
                            <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
                                <Ionicons name="share-outline" size={20} color="#fff" />
                                <Text style={styles.shareButtonText}>Share Group Code</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/** Members Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                        {isCreator && (
                            <TouchableOpacity
                                style={styles.addMemberButton}
                                onPress={() => setIsAddMemberModalVisible(true)}
                            >
                                <Ionicons name="person-add-outline" size={20} color="#3f51b5" />
                                <Text style={styles.addMemberText}>Add Member</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.membersList}>
                        {members.map((member) => (
                        <View key={member.id} style={styles.memberItem}>
                            <View style={styles.memberInfo}>
                                <View style={styles.memberAvatar}>
                                    {member.photoURL ? (
                                      <Image source={{uri: member.photoURL}}
                                      style={styles.memberAvatarImage} />
                                    ): (
                                      <View style={styles.memberAvatar}>
                                        <Text style={styles.memberInitial}>
                                          {member.name.charAt(0).toUpperCase()}
                                        </Text>
                                      </View>
                                    )}
                                </View>
                                <Text style={styles.memberName}>
                                    {member.name} {member.id === groupDetails?.createdBy && '(Creator)'} 
                                    {member.id === currentUserId && ' (You)'}
                                </Text>
                            </View>
                            {removeMemberDesign(member)}
                        </View>
                        ))}
                    </View>
                </View>

                {/** Voting Session Section */}
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Voting Sessions</Text>
      <TouchableOpacity
        style={styles.createVotingSessionButton}
        onPress={handleCreateVotingSession}
      >
        <Ionicons name="checkbox-outline" size={20} color="#3f51b5" />
        <Text style={styles.createVotingSessionText}>Create Voting Session</Text>
      </TouchableOpacity>
    </View>

    {votingSessions.length === 0 ? (
      <View style={styles.emptyVotingSessionsContainter}>
        <Text style={styles.emptyVotingSessionsText}>No Voting Sessions yet</Text>
        <Text style={styles.emptyVotingSessionsSubtext}>Create a voting session to get started</Text>
      </View>
    ) : (
      <View style={styles.votingSessionList}>
        {votingSessions.map((session) => {
  const now = Date.now();
  let sessionEndMillis = 0;

if (session?.endTime?.seconds) {
  sessionEndMillis = session.endTime.seconds * 1000;
} else if (typeof session?.endTime === 'string' || session?.endTime instanceof Date) {
  sessionEndMillis = new Date(session.endTime).getTime();
}

const isExpired = sessionEndMillis > 0 && Date.now() > sessionEndMillis;

  const title = isExpired ? `${session.name} Results` : session.name;
  const createdAtDate = session.createdAt?.seconds
    ? new Date(session.createdAt.seconds * 1000).toLocaleDateString()
    : "Date unavailable";
  const voteCount = session.votes ? Object.keys(session.votes).length : 0;

  return (
    <View
      key={session.id}
      style={[
        styles.votingSessionItem,
        { borderLeftColor: isExpired ? '#f44336' : '#4caf50' } // 🔴 Red if expired, 🟢 Green if active
      ]}
    >
      <View style={styles.votingSessionContent}>
        <Text style={styles.votingSessionTitle}>{title}</Text>
        <Text style={styles.votingSessionDate}>{createdAtDate}</Text>
        <Text style={styles.votingSessionDescription}>
          {session.description || "No description"}
        </Text>
        <Text style={styles.participantsText}>{voteCount} votes cast</Text>
      </View>
      <TouchableOpacity
        style={styles.votingSessionButton}
        onPress={() => {
          if (isExpired) {
            router.push(`/results`);
          } else {
            router.push({
              pathname: '/(tabs)/swipe',
              params: { sessionId: session.id, groupId },
            });
          }
        }}
      >
        <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
      </TouchableOpacity>
    </View>
  );
})}

</View>

    )}
  </View>

                {/** Leave Group */}
                {!isCreator && (
                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                        <Ionicons name="exit-outline" size={20} color="#fff" />
                        <Text style={styles.leaveButtonText}>Leave Group</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/**User Search Modal */}
            <UserSearchModal
                visible={isAddMemberModalVisible}
                onClose={() => setIsAddMemberModalVisible(false)}
                onAddUser={async(userIds) =>{
                    await handleAddUsers(userIds);
                    setIsAddMemberModalVisible(false);
                }}
                currentMembers={members.map(member=>member.id)}
                groupId={groupId}
            />

            {/** TMDB List Generator Modal */}
            <TMDBListGenerator
                visible={isTMDBModalVisible}
                onClose={() => setIsTMDBModalVisible(false)}
                onListCreated={handleTMDBListCreated}
                groupId={groupId}
            />

            {/** Voting Session Modal */}
            <VotingSessionModal
            visible={isVotingSessionModalVisible}
            onClose={() => setIsVotingSessionModalVisible(false)}
            onSessionCreated={handleVotingSessionCreated}
            onShowTMDBGenerator={() => {
                setIsVotingSessionModalVisible(false);
                setIsTMDBModalVisible(true);
            }}
            onShowPlacesGenerator={() => {
                setIsVotingSessionModalVisible(false); // Hide voting modal
                setIsPlacesModalVisible(true);         // Show Places modal
            }}
            groupId={groupId}
            />
            <PlacesListGenerator
            visible={isPlacesModalVisible}
            onClose={() => setIsPlacesModalVisible(false)}
            groupId={groupId}
            onListCreated={async (newList) => {
                await fetchGroupData();
                setIsPlacesModalVisible(false);
                console.log("Success. Places list created");
            }}
            />

        </SafeAreaView>
    );
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3f51b5" />
          </TouchableOpacity>
          <Text style={styles.groupName}>{groupName}</Text>
        </View>
 
        {/* Description */}
        {groupDetails?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{groupDetails.description}</Text>
          </View>
        )}
 
        {/* Join Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Code</Text>
          <View style={styles.joinCodeContainer}>
            <Text style={styles.joinCodeText}>{groupId}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Share Group Code</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members ({members.length})</Text>
            {isCreator && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => setIsAddMemberModalVisible(true)}
              >
                <Ionicons name="person-add-outline" size={20} color="#3f51b5" />
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
                      source={{uri: member.photoURL}}
                      style={styles.memberAvatarImage} 
                    />
                  ) : (
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.memberName}>
                    {member.name} {member.id === groupDetails?.createdBy && "(Creator)"}
                    {member.id === currentUserId && " (You)"}
                  </Text>
                </View>
                {removeMemberDesign(member)}
              </View>
            ))}
          </View>
        </View>
        {/* Voting Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Voting Sessions</Text>
            <TouchableOpacity
              style={styles.createVotingSessionButton}
              onPress={handleCreateVotingSession}
            >
              <Ionicons name="checkbox-outline" size={20} color="#3f51b5" />
              <Text style={styles.createVotingSessionText}>Create Voting Session</Text>
            </TouchableOpacity>
          </View>
 
          {votingSessions.length === 0 ? (
            <View style={styles.emptyVotingSessionsContainer}>
              <Text style={styles.emptyVotingSessionsText}>No Voting Sessions yet</Text>
              <Text style={styles.emptyVotingSessionsSubtext}>
                Create a voting session to get started
              </Text>
            </View>
          ) : (
            <View style={styles.votingSessionList}>
              {votingSessions.map((session) => {
                const now = Date.now();
                let sessionEndMillis = 0;

                const currentVoteCount = session.calculatedVoteCount !== undefined
    ? session.calculatedVoteCount
    : 0;
 
 
                if (session?.endTime?.seconds) {
                  sessionEndMillis = session.endTime.seconds * 1000;
                } else if (
                  typeof session?.endTime === "string" ||
                  session?.endTime instanceof Date
                ) {
                  sessionEndMillis = new Date(session.endTime).getTime();
                }
 
                const isExpired = sessionEndMillis > 0 && now > sessionEndMillis;
                const title = isExpired ? `${session.name} Results` : session.name;
                const createdAtDate = session.createdAt?.seconds
                  ? new Date(session.createdAt.seconds * 1000).toLocaleDateString()
                  : "Date unavailable";
                const voteCount = session.votes ? Object.keys(session.votes).length : 0;
 
                return (
                  <View
                    key={session.id}
                    style={[
                      styles.votingSessionItem,
                      { borderLeftColor: isExpired ? "#f44336" : "#4caf50" },
                    ]}
                  >
                    <View style={styles.votingSessionContent}>
                      <Text style={styles.votingSessionTitle}>{title}</Text>
                      <Text style={styles.votingSessionDate}>{createdAtDate}</Text>
                      <Text style={styles.votingSessionDescription}>
                        {session.description || "No description"}
                      </Text>
                      <Text style={styles.participantsText}>{voteCount} votes cast</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.votingSessionButton}
                      onPress={() => {
                        if (isExpired) {
                          router.push(`/results/${session.id}`);
                        } else {
                          router.push({
                            pathname: "/(tabs)/swipe",
                            params: { sessionId: session.id, groupId },
                          });
                        }
                      }}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        {/* Leave Group Button */}
        {!isCreator && (
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={20} color="#fff" />
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
 
      {/* Add Member Modal */}
      <UserSearchModal
        visible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        onAddUser={async (userIds) => {
          await handleAddUsers(userIds);
          setIsAddMemberModalVisible(false);
        }}
        currentMembers={members.map((m) => m.id)}
        groupId={groupId}
      />
 
      {/* TMDB List Generator */}
      <TMDBListGenerator
        visible={isTMDBModalVisible}
        onClose={() => setIsTMDBModalVisible(false)}
        onListCreated={handleTMDBListCreated}
        groupId={groupId}
      />
 
      {/* Voting Session Modal */}
      <VotingSessionModal
        visible={isVotingSessionModalVisible}
        onClose={() => setIsVotingSessionModalVisible(false)}
        onSessionCreated={handleVotingSessionCreated}
        onShowTMDBGenerator={() => {
          setIsVotingSessionModalVisible(false);
          setIsTMDBModalVisible(true);
        }}
        onShowPlacesGenerator={() => {
          setIsVotingSessionModalVisible(false);
          setIsPlacesModalVisible(true);
        }}
        groupId={groupId}
      />
 
      {/* Places List Generator */}
      <PlacesListGenerator
        visible={isPlacesModalVisible}
        onClose={() => setIsPlacesModalVisible(false)}
        groupId={groupId}
        onListCreated={async () => {
          await fetchGroupData();
          setIsPlacesModalVisible(false);
        }}
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
    createVotingSessionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createVotingSessionText: {
        color: '#3f51b5',
        marginLeft: 4,
        fontWeight: '600',
    },
    votingSessionList: {
        marginTop: 8,
    },
    votingSessionItem: {
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
    votingSessionContent: {
        flex: 1,
    },
    votingSessionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    votingSessionDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    votingSessionDescription: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
    participantsText: {
        fontSize: 12,
        color: '#3f51b5',
        marginTop: 6,
    },
    votingSessionButton:{
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyVotingSessionsContainter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyVotingSessionsText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    emptyVotingSessionsSubtext: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 4,
    },
    joinCodeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3f51b5',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 1.2,
    },
    memberAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    }
});