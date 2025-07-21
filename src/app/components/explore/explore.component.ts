import { Component, HostListener, OnInit } from '@angular/core';
import { UserServiceService } from '../../services/user-service.service';
import { User } from '../../interfaces/user';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PostServiceService } from '../../services/post-service.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  searchResults: User[] = [];
  topUsers: User[] = [];
  searchTerm$ = new Subject<string>();
  isLoading = false;
  isMobileView = false;
  showTopUsers = true;
  experienceFilter: number | null = null;
  availableExperienceLevels: number[] = [1, 2, 3, 5, 7, 10, 15];

  constructor(
    private userService: UserServiceService,
    private postService: PostServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkViewport();
    this.loadTopUsers();
    
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoading = true;
        this.showTopUsers = term.length === 0;
        return this.userService.searchUsers(term);
      })
    ).subscribe(users => {
      this.searchResults = this.removeDuplicateUsers(users);
      this.isLoading = false;
    });
  }

  private removeDuplicateUsers(users: User[]): User[] {
    const uniqueUsers = new Map<string, User>();
    users.forEach(user => {
      if (user.username && !uniqueUsers.has(user.username)) {
        uniqueUsers.set(user.username, user);
      }
    });
    return Array.from(uniqueUsers.values());
  }

  async loadTopUsers(): Promise<void> {
    this.isLoading = true;
    try {
      const users = await this.userService.getAllUsers().toPromise();
      const uniqueUsers = this.removeDuplicateUsers(users || []);
      
      const allPosts = await this.postService.getAllPosts().toPromise();
      
      const usersWithStats = uniqueUsers.map(user => {
        const userPosts = allPosts?.filter(post => post.user?.id === user.id) || [];
        const postCount = userPosts.length;
        const commentCount = userPosts.reduce((total, post) => {
          return total + (post.comments?.length || 0);
        }, 0);
        
        return {
          ...user,
          postCount,
          commentCount,
          engagementScore: postCount + (commentCount * 0.5) 
        };
      });

      this.topUsers = usersWithStats.sort((a, b) => b.engagementScore - a.engagementScore);
      
    } catch (err) {
      console.error('Error loading top users:', err);
    } finally {
      this.isLoading = false;
    }
  }

  search(term: string): void {
    if (term.length < 2) {
      this.searchResults = [];
      this.showTopUsers = true;
      return;
    }
    
    this.isLoading = true;
    this.showTopUsers = false;
    this.userService.searchUsers(term).subscribe({
      next: (users) => {
        this.searchResults = this.removeDuplicateUsers(users);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading = false;
      }
    });
  }

  filterByExperience(experience: number | null): void {
    this.experienceFilter = experience;
  }

  get filteredTopUsers(): User[] {
    if (!this.experienceFilter) return this.topUsers;
    return this.topUsers.filter(user => 
      user.experience && user.experience >= this.experienceFilter!
    );
  }

  navigateToProfile(username: string): void {
    this.router.navigate(['/user', username]);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkViewport();
  }
    
  checkViewport(): void {
    this.isMobileView = window.innerWidth < 768;
  }
}