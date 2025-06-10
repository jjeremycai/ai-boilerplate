import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../services/api';
import type { Project } from '@shared/types';

export function ProjectsScreen() {
  const apiClient = useApiClient();

  const { data: projects, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
  });

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity style={styles.projectCard}>
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      <View style={styles.projectContent}>
        <Text style={styles.projectName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.projectStatus}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Create your first project to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  colorIndicator: {
    width: 4,
  },
  projectContent: {
    flex: 1,
    padding: 16,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  projectStatus: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});