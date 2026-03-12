//-----Types.File-----
export interface ProblemDetails  {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}
export function deserializeProblemDetails(json: string): ProblemDetails {
  const data = JSON.parse(json) as ProblemDetails;
  initProblemDetails(data);
  return data;
}
export function initProblemDetails(_data: ProblemDetails) {
    return _data;
}
export function serializeProblemDetails(_data: ProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeProblemDetails(_data as ProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeProblemDetails(_data: ProblemDetails): ProblemDetails {
  const data: Record<string, any> = { ..._data };
  return data as ProblemDetails;
}
export interface HttpValidationProblemDetails extends ProblemDetails  {
  errors: { [key: string]: string[]; };
  [key: string]: any;
}
export function deserializeHttpValidationProblemDetails(json: string): HttpValidationProblemDetails {
  const data = JSON.parse(json) as HttpValidationProblemDetails;
  initHttpValidationProblemDetails(data);
  return data;
}
export function initHttpValidationProblemDetails(_data: HttpValidationProblemDetails) {
  initProblemDetails(_data);
    return _data;
}
export function serializeHttpValidationProblemDetails(_data: HttpValidationProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeHttpValidationProblemDetails(_data as HttpValidationProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeHttpValidationProblemDetails(_data: HttpValidationProblemDetails): HttpValidationProblemDetails {
  const data = prepareSerializeProblemDetails(_data as HttpValidationProblemDetails) as Record<string, any>;
  return data as HttpValidationProblemDetails;
}
export interface ValidationProblemDetails extends HttpValidationProblemDetails  {
  errors: { [key: string]: string[]; };
  [key: string]: any;
}
export function deserializeValidationProblemDetails(json: string): ValidationProblemDetails {
  const data = JSON.parse(json) as ValidationProblemDetails;
  initValidationProblemDetails(data);
  return data;
}
export function initValidationProblemDetails(_data: ValidationProblemDetails) {
  initHttpValidationProblemDetails(_data);
    return _data;
}
export function serializeValidationProblemDetails(_data: ValidationProblemDetails | undefined) {
  if (_data) {
    _data = prepareSerializeValidationProblemDetails(_data as ValidationProblemDetails);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeValidationProblemDetails(_data: ValidationProblemDetails): ValidationProblemDetails {
  const data = prepareSerializeHttpValidationProblemDetails(_data as ValidationProblemDetails) as Record<string, any>;
  return data as ValidationProblemDetails;
}
export interface RegisterUserDto  {
  email: string;
  legalName: string;
  groupNumber: string | null;
  password: string;
}
export function deserializeRegisterUserDto(json: string): RegisterUserDto {
  const data = JSON.parse(json) as RegisterUserDto;
  initRegisterUserDto(data);
  return data;
}
export function initRegisterUserDto(_data: RegisterUserDto) {
    return _data;
}
export function serializeRegisterUserDto(_data: RegisterUserDto | undefined) {
  if (_data) {
    _data = prepareSerializeRegisterUserDto(_data as RegisterUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeRegisterUserDto(_data: RegisterUserDto): RegisterUserDto {
  const data: Record<string, any> = { ..._data };
  return data as RegisterUserDto;
}
export interface VerificationDto  {
  email: string;
}
export function deserializeVerificationDto(json: string): VerificationDto {
  const data = JSON.parse(json) as VerificationDto;
  initVerificationDto(data);
  return data;
}
export function initVerificationDto(_data: VerificationDto) {
    return _data;
}
export function serializeVerificationDto(_data: VerificationDto | undefined) {
  if (_data) {
    _data = prepareSerializeVerificationDto(_data as VerificationDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeVerificationDto(_data: VerificationDto): VerificationDto {
  const data: Record<string, any> = { ..._data };
  return data as VerificationDto;
}
export interface UserDto  {
  id: string;
  email: string;
  legalName: string;
  groupNumber: string | null;
}
export function deserializeUserDto(json: string): UserDto {
  const data = JSON.parse(json) as UserDto;
  initUserDto(data);
  return data;
}
export function initUserDto(_data: UserDto) {
    return _data;
}
export function serializeUserDto(_data: UserDto | undefined) {
  if (_data) {
    _data = prepareSerializeUserDto(_data as UserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeUserDto(_data: UserDto): UserDto {
  const data: Record<string, any> = { ..._data };
  return data as UserDto;
}
export interface CurrentUserDto extends UserDto  {
  username: string;
}
export function deserializeCurrentUserDto(json: string): CurrentUserDto {
  const data = JSON.parse(json) as CurrentUserDto;
  initCurrentUserDto(data);
  return data;
}
export function initCurrentUserDto(_data: CurrentUserDto) {
  initUserDto(_data);
    return _data;
}
export function serializeCurrentUserDto(_data: CurrentUserDto | undefined) {
  if (_data) {
    _data = prepareSerializeCurrentUserDto(_data as CurrentUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCurrentUserDto(_data: CurrentUserDto): CurrentUserDto {
  const data = prepareSerializeUserDto(_data as CurrentUserDto) as Record<string, any>;
  return data as CurrentUserDto;
}
export interface PagedResultOfUserDto  {
  data: UserDto[];
  totalCount: number;
}
export function deserializePagedResultOfUserDto(json: string): PagedResultOfUserDto {
  const data = JSON.parse(json) as PagedResultOfUserDto;
  initPagedResultOfUserDto(data);
  return data;
}
export function initPagedResultOfUserDto(_data: PagedResultOfUserDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initUserDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfUserDto(_data: PagedResultOfUserDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfUserDto(_data as PagedResultOfUserDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfUserDto(_data: PagedResultOfUserDto): PagedResultOfUserDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeUserDto(item)
    );
  }
  return data as PagedResultOfUserDto;
}
export enum SortOrder {
    Asc = "Asc",
    Desc = "Desc",
}
export interface SubmissionDto  {
  id: number;
  state: SubmissionState;
  mark: string | null;
  lastSubmittedAtUTC: Date | null;
  lastMarkedAtUTC: Date | null;
  attachments: FileInfoDto[];
  author: UserDto;
  comments: CommentDto[];
}
export function deserializeSubmissionDto(json: string): SubmissionDto {
  const data = JSON.parse(json) as SubmissionDto;
  initSubmissionDto(data);
  return data;
}
export function initSubmissionDto(_data: SubmissionDto) {
  if (_data) {
    _data.state = _data["state"];
    _data.lastSubmittedAtUTC = _data["lastSubmittedAtUTC"] ? new Date(_data["lastSubmittedAtUTC"].toString()) : <any>null;
    _data.lastMarkedAtUTC = _data["lastMarkedAtUTC"] ? new Date(_data["lastMarkedAtUTC"].toString()) : <any>null;
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
    _data.author = _data["author"] && initUserDto(_data["author"]);
    if (Array.isArray(_data["comments"])) {
      _data.comments = _data["comments"].map(item => 
        initCommentDto(item)
      );
    }
  }
  return _data;
}
export function serializeSubmissionDto(_data: SubmissionDto | undefined) {
  if (_data) {
    _data = prepareSerializeSubmissionDto(_data as SubmissionDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeSubmissionDto(_data: SubmissionDto): SubmissionDto {
  const data: Record<string, any> = { ..._data };
  data["lastSubmittedAtUTC"] = _data.lastSubmittedAtUTC && _data.lastSubmittedAtUTC.toISOString();
  data["lastMarkedAtUTC"] = _data.lastMarkedAtUTC && _data.lastMarkedAtUTC.toISOString();
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  if (Array.isArray(_data.comments)) {
    data["comments"] = _data.comments.map(item => 
        prepareSerializeCommentDto(item)
    );
  }
  return data as SubmissionDto;
}
export enum SubmissionState {
    Draft = "Draft",
    Submitted = "Submitted",
    Accepted = "Accepted",
}
export interface FileInfoDto  {
  id: string;
  fileName: string;
  size: number;
  metadata: FileMetadataDto;
  createdAt: Date;
}
export function deserializeFileInfoDto(json: string): FileInfoDto {
  const data = JSON.parse(json) as FileInfoDto;
  initFileInfoDto(data);
  return data;
}
export function initFileInfoDto(_data: FileInfoDto) {
  if (_data) {
    _data.metadata = _data["metadata"] && initFileMetadataDto(_data["metadata"]);
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
  }
  return _data;
}
export function serializeFileInfoDto(_data: FileInfoDto | undefined) {
  if (_data) {
    _data = prepareSerializeFileInfoDto(_data as FileInfoDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeFileInfoDto(_data: FileInfoDto): FileInfoDto {
  const data: Record<string, any> = { ..._data };
  data["metadata"] = _data.metadata && prepareSerializeFileMetadataDto(_data.metadata);
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  return data as FileInfoDto;
}
export interface FileMetadataDto  {
  externalId: string | null;
}
export function deserializeFileMetadataDto(json: string): FileMetadataDto {
  const data = JSON.parse(json) as FileMetadataDto;
  initFileMetadataDto(data);
  return data;
}
export function initFileMetadataDto(_data: FileMetadataDto) {
    return _data;
}
export function serializeFileMetadataDto(_data: FileMetadataDto | undefined) {
  if (_data) {
    _data = prepareSerializeFileMetadataDto(_data as FileMetadataDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeFileMetadataDto(_data: FileMetadataDto): FileMetadataDto {
  const data: Record<string, any> = { ..._data };
  return data as FileMetadataDto;
}
export interface CommentDto  {
  id: number;
  createdAt: Date;
  lastEditedAt: Date | null;
  author: UserDto;
  textLexical: string;
}
export function deserializeCommentDto(json: string): CommentDto {
  const data = JSON.parse(json) as CommentDto;
  initCommentDto(data);
  return data;
}
export function initCommentDto(_data: CommentDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
    _data.lastEditedAt = _data["lastEditedAt"] ? new Date(_data["lastEditedAt"].toString()) : <any>null;
    _data.author = _data["author"] && initUserDto(_data["author"]);
  }
  return _data;
}
export function serializeCommentDto(_data: CommentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCommentDto(_data as CommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCommentDto(_data: CommentDto): CommentDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  data["lastEditedAt"] = _data.lastEditedAt && _data.lastEditedAt.toISOString();
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  return data as CommentDto;
}
export interface CreateSubmissionDto  {
  attachments: FileInfoDto[];
}
export function deserializeCreateSubmissionDto(json: string): CreateSubmissionDto {
  const data = JSON.parse(json) as CreateSubmissionDto;
  initCreateSubmissionDto(data);
  return data;
}
export function initCreateSubmissionDto(_data: CreateSubmissionDto) {
  if (_data) {
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initFileInfoDto(item)
      );
    }
  }
  return _data;
}
export function serializeCreateSubmissionDto(_data: CreateSubmissionDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateSubmissionDto(_data as CreateSubmissionDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateSubmissionDto(_data: CreateSubmissionDto): CreateSubmissionDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeFileInfoDto(item)
    );
  }
  return data as CreateSubmissionDto;
}
export interface PagedResultOfSubmissionListItem  {
  data: SubmissionListItem[];
  totalCount: number;
}
export function deserializePagedResultOfSubmissionListItem(json: string): PagedResultOfSubmissionListItem {
  const data = JSON.parse(json) as PagedResultOfSubmissionListItem;
  initPagedResultOfSubmissionListItem(data);
  return data;
}
export function initPagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initSubmissionListItem(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfSubmissionListItem(_data as PagedResultOfSubmissionListItem);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfSubmissionListItem(_data: PagedResultOfSubmissionListItem): PagedResultOfSubmissionListItem {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeSubmissionListItem(item)
    );
  }
  return data as PagedResultOfSubmissionListItem;
}
export interface SubmissionListItem  {
  id: number;
  state: SubmissionState;
  mark: string | null;
  author: UserDto;
}
export function deserializeSubmissionListItem(json: string): SubmissionListItem {
  const data = JSON.parse(json) as SubmissionListItem;
  initSubmissionListItem(data);
  return data;
}
export function initSubmissionListItem(_data: SubmissionListItem) {
  if (_data) {
    _data.state = _data["state"];
    _data.author = _data["author"] && initUserDto(_data["author"]);
  }
  return _data;
}
export function serializeSubmissionListItem(_data: SubmissionListItem | undefined) {
  if (_data) {
    _data = prepareSerializeSubmissionListItem(_data as SubmissionListItem);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeSubmissionListItem(_data: SubmissionListItem): SubmissionListItem {
  const data: Record<string, any> = { ..._data };
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  return data as SubmissionListItem;
}
export interface MarkDto  {
  mark: string | null;
  markComment: string | null;
}
export function deserializeMarkDto(json: string): MarkDto {
  const data = JSON.parse(json) as MarkDto;
  initMarkDto(data);
  return data;
}
export function initMarkDto(_data: MarkDto) {
    return _data;
}
export function serializeMarkDto(_data: MarkDto | undefined) {
  if (_data) {
    _data = prepareSerializeMarkDto(_data as MarkDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeMarkDto(_data: MarkDto): MarkDto {
  const data: Record<string, any> = { ..._data };
  return data as MarkDto;
}
export interface PagedResultOfPublicationDto  {
  data: PublicationDto[];
  totalCount: number;
}
export function deserializePagedResultOfPublicationDto(json: string): PagedResultOfPublicationDto {
  const data = JSON.parse(json) as PagedResultOfPublicationDto;
  initPagedResultOfPublicationDto(data);
  return data;
}
export function initPagedResultOfPublicationDto(_data: PagedResultOfPublicationDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initPublicationDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfPublicationDto(_data: PagedResultOfPublicationDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfPublicationDto(_data as PagedResultOfPublicationDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfPublicationDto(_data: PagedResultOfPublicationDto): PagedResultOfPublicationDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializePublicationDto(item)
    );
  }
  return data as PagedResultOfPublicationDto;
}
export interface PublicationDto  {
  id: number;
  createdAtUTC: Date;
  lastUpdatedAtUTC: Date | null;
  content: string | null;
  author: UserDto;
  attachments: Attachment[];
  type: PublicationType;
  publicationPayload: PublicationPayload;
}
export function deserializePublicationDto(json: string): PublicationDto {
  const data = JSON.parse(json) as PublicationDto;
  initPublicationDto(data);
  return data;
}
export function initPublicationDto(_data: PublicationDto) {
  if (_data) {
    _data.createdAtUTC = _data["createdAtUTC"] ? new Date(_data["createdAtUTC"].toString()) : <any>null;
    _data.lastUpdatedAtUTC = _data["lastUpdatedAtUTC"] ? new Date(_data["lastUpdatedAtUTC"].toString()) : <any>null;
    _data.author = _data["author"] && initUserDto(_data["author"]);
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initAttachment(item)
      );
    }
    _data.type = _data["type"];
    _data.publicationPayload = _data["publicationPayload"] && initPublicationPayload(_data["publicationPayload"]);
  }
  return _data;
}
export function serializePublicationDto(_data: PublicationDto | undefined) {
  if (_data) {
    _data = prepareSerializePublicationDto(_data as PublicationDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePublicationDto(_data: PublicationDto): PublicationDto {
  const data: Record<string, any> = { ..._data };
  data["createdAtUTC"] = _data.createdAtUTC && _data.createdAtUTC.toISOString();
  data["lastUpdatedAtUTC"] = _data.lastUpdatedAtUTC && _data.lastUpdatedAtUTC.toISOString();
  data["author"] = _data.author && prepareSerializeUserDto(_data.author);
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeAttachment(item)
    );
  }
  data["publicationPayload"] = _data.publicationPayload && prepareSerializePublicationPayload(_data.publicationPayload);
  return data as PublicationDto;
}
export interface Attachment  {
  uuid: string;
  fileName: string;
  size: number;
  createdAt: Date;
}
export function deserializeAttachment(json: string): Attachment {
  const data = JSON.parse(json) as Attachment;
  initAttachment(data);
  return data;
}
export function initAttachment(_data: Attachment) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
  }
  return _data;
}
export function serializeAttachment(_data: Attachment | undefined) {
  if (_data) {
    _data = prepareSerializeAttachment(_data as Attachment);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAttachment(_data: Attachment): Attachment {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  return data as Attachment;
}
export enum PublicationType {
    Announcement = "Announcement",
    Assignment = "Assignment",
}
export interface PublicationPayload  {
  publicationType: string;
}
export function deserializePublicationPayload(json: string): PublicationPayload {
  const data = JSON.parse(json) as PublicationPayload;
  if (data["publicationType"] === "Announcement") {
    return initAnnouncementPayload(data as AnnouncementPayload);
  }
  if (data["publicationType"] === "Assignment") {
    return initAssignmentPayload(data as AssignmentPayload);
  }
  initPublicationPayload(data);
  return data;
}
export function initPublicationPayload(_data: PublicationPayload) {
  return _data;
}
export function serializePublicationPayload(_data: PublicationPayload | undefined) {
  if (_data) {
    _data = prepareSerializePublicationPayload(_data as PublicationPayload);
      _data["publicationType"] = "PublicationPayload";
  }
  return JSON.stringify(_data);
}
export function prepareSerializePublicationPayload(_data: PublicationPayload): PublicationPayload {
  const data: Record<string, any> = { ..._data };
  return data as PublicationPayload;
}
export interface AnnouncementPayload extends PublicationPayload  {
}
export function deserializeAnnouncementPayload(json: string): AnnouncementPayload {
  const data = JSON.parse(json) as AnnouncementPayload;
  initAnnouncementPayload(data);
  return data;
}
export function initAnnouncementPayload(_data: AnnouncementPayload) {
  initPublicationPayload(_data);
  return _data;
}
export function serializeAnnouncementPayload(_data: AnnouncementPayload | undefined) {
  if (_data) {
    _data = prepareSerializeAnnouncementPayload(_data as AnnouncementPayload);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAnnouncementPayload(_data: AnnouncementPayload): AnnouncementPayload {
  const data = prepareSerializePublicationPayload(_data as AnnouncementPayload) as Record<string, any>;
  return data as AnnouncementPayload;
}
export interface AssignmentPayload extends PublicationPayload  {
  title: string;
  deadlineUtc: Date | null;
}
export function deserializeAssignmentPayload(json: string): AssignmentPayload {
  const data = JSON.parse(json) as AssignmentPayload;
  initAssignmentPayload(data);
  return data;
}
export function initAssignmentPayload(_data: AssignmentPayload) {
  initPublicationPayload(_data);
  if (_data) {
    _data.deadlineUtc = _data["deadlineUtc"] ? new Date(_data["deadlineUtc"].toString()) : <any>null;
  }
  return _data;
}
export function serializeAssignmentPayload(_data: AssignmentPayload | undefined) {
  if (_data) {
    _data = prepareSerializeAssignmentPayload(_data as AssignmentPayload);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAssignmentPayload(_data: AssignmentPayload): AssignmentPayload {
  const data = prepareSerializePublicationPayload(_data as AssignmentPayload) as Record<string, any>;
  data["deadlineUtc"] = _data.deadlineUtc && _data.deadlineUtc.toISOString();
  return data as AssignmentPayload;
}
export interface PagedResultOfCourseListItemDto  {
  data: CourseListItemDto[];
  totalCount: number;
}
export function deserializePagedResultOfCourseListItemDto(json: string): PagedResultOfCourseListItemDto {
  const data = JSON.parse(json) as PagedResultOfCourseListItemDto;
  initPagedResultOfCourseListItemDto(data);
  return data;
}
export function initPagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initCourseListItemDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfCourseListItemDto(_data as PagedResultOfCourseListItemDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfCourseListItemDto(_data: PagedResultOfCourseListItemDto): PagedResultOfCourseListItemDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeCourseListItemDto(item)
    );
  }
  return data as PagedResultOfCourseListItemDto;
}
export interface CourseListItemDto  {
  id: number;
  createdAt: Date;
  title: string;
  description: string;
}
export function deserializeCourseListItemDto(json: string): CourseListItemDto {
  const data = JSON.parse(json) as CourseListItemDto;
  initCourseListItemDto(data);
  return data;
}
export function initCourseListItemDto(_data: CourseListItemDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
  }
  return _data;
}
export function serializeCourseListItemDto(_data: CourseListItemDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseListItemDto(_data as CourseListItemDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseListItemDto(_data: CourseListItemDto): CourseListItemDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  return data as CourseListItemDto;
}
export interface CourseDto  {
  id: number;
  createdAt: Date;
  owner: UserDto;
  teachers: UserDto[];
  inviteCode: string;
  title: string;
  description: string;
}
export function deserializeCourseDto(json: string): CourseDto {
  const data = JSON.parse(json) as CourseDto;
  initCourseDto(data);
  return data;
}
export function initCourseDto(_data: CourseDto) {
  if (_data) {
    _data.createdAt = _data["createdAt"] ? new Date(_data["createdAt"].toString()) : <any>null;
    _data.owner = _data["owner"] && initUserDto(_data["owner"]);
    if (Array.isArray(_data["teachers"])) {
      _data.teachers = _data["teachers"].map(item => 
        initUserDto(item)
      );
    }
  }
  return _data;
}
export function serializeCourseDto(_data: CourseDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseDto(_data as CourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseDto(_data: CourseDto): CourseDto {
  const data: Record<string, any> = { ..._data };
  data["createdAt"] = _data.createdAt && _data.createdAt.toISOString();
  data["owner"] = _data.owner && prepareSerializeUserDto(_data.owner);
  if (Array.isArray(_data.teachers)) {
    data["teachers"] = _data.teachers.map(item => 
        prepareSerializeUserDto(item)
    );
  }
  return data as CourseDto;
}
export interface PagedResultOfCourseMemberDto  {
  data: CourseMemberDto[];
  totalCount: number;
}
export function deserializePagedResultOfCourseMemberDto(json: string): PagedResultOfCourseMemberDto {
  const data = JSON.parse(json) as PagedResultOfCourseMemberDto;
  initPagedResultOfCourseMemberDto(data);
  return data;
}
export function initPagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto) {
  if (_data) {
    if (Array.isArray(_data["data"])) {
      _data.data = _data["data"].map(item => 
        initCourseMemberDto(item)
      );
    }
  }
  return _data;
}
export function serializePagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto | undefined) {
  if (_data) {
    _data = prepareSerializePagedResultOfCourseMemberDto(_data as PagedResultOfCourseMemberDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePagedResultOfCourseMemberDto(_data: PagedResultOfCourseMemberDto): PagedResultOfCourseMemberDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.data)) {
    data["data"] = _data.data.map(item => 
        prepareSerializeCourseMemberDto(item)
    );
  }
  return data as PagedResultOfCourseMemberDto;
}
export interface CourseMemberDto  {
  id: string;
  email: string;
  legalName: string;
  groupNumber: string | null;
  isTeacher: boolean;
  isOwner: boolean;
}
export function deserializeCourseMemberDto(json: string): CourseMemberDto {
  const data = JSON.parse(json) as CourseMemberDto;
  initCourseMemberDto(data);
  return data;
}
export function initCourseMemberDto(_data: CourseMemberDto) {
    return _data;
}
export function serializeCourseMemberDto(_data: CourseMemberDto | undefined) {
  if (_data) {
    _data = prepareSerializeCourseMemberDto(_data as CourseMemberDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCourseMemberDto(_data: CourseMemberDto): CourseMemberDto {
  const data: Record<string, any> = { ..._data };
  return data as CourseMemberDto;
}
export interface CreateCourseDto  {
  title: string;
  description: string;
}
export function deserializeCreateCourseDto(json: string): CreateCourseDto {
  const data = JSON.parse(json) as CreateCourseDto;
  initCreateCourseDto(data);
  return data;
}
export function initCreateCourseDto(_data: CreateCourseDto) {
    return _data;
}
export function serializeCreateCourseDto(_data: CreateCourseDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateCourseDto(_data as CreateCourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateCourseDto(_data: CreateCourseDto): CreateCourseDto {
  const data: Record<string, any> = { ..._data };
  return data as CreateCourseDto;
}
export interface PatchCourseDto  {
  title: string;
  description: string;
}
export function deserializePatchCourseDto(json: string): PatchCourseDto {
  const data = JSON.parse(json) as PatchCourseDto;
  initPatchCourseDto(data);
  return data;
}
export function initPatchCourseDto(_data: PatchCourseDto) {
    return _data;
}
export function serializePatchCourseDto(_data: PatchCourseDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchCourseDto(_data as PatchCourseDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchCourseDto(_data: PatchCourseDto): PatchCourseDto {
  const data: Record<string, any> = { ..._data };
  return data as PatchCourseDto;
}
export interface CreateCommentDto  {
  textLexical: string;
}
export function deserializeCreateCommentDto(json: string): CreateCommentDto {
  const data = JSON.parse(json) as CreateCommentDto;
  initCreateCommentDto(data);
  return data;
}
export function initCreateCommentDto(_data: CreateCommentDto) {
    return _data;
}
export function serializeCreateCommentDto(_data: CreateCommentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateCommentDto(_data as CreateCommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateCommentDto(_data: CreateCommentDto): CreateCommentDto {
  const data: Record<string, any> = { ..._data };
  return data as CreateCommentDto;
}
export interface PatchCommentDto  {
  textLexical: string;
}
export function deserializePatchCommentDto(json: string): PatchCommentDto {
  const data = JSON.parse(json) as PatchCommentDto;
  initPatchCommentDto(data);
  return data;
}
export function initPatchCommentDto(_data: PatchCommentDto) {
    return _data;
}
export function serializePatchCommentDto(_data: PatchCommentDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchCommentDto(_data as PatchCommentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchCommentDto(_data: PatchCommentDto): PatchCommentDto {
  const data: Record<string, any> = { ..._data };
  return data as PatchCommentDto;
}
export interface AssignmentStatisticDto  {
  submitted: number;
  notSubmitted: number;
  marked: number;
  total: number;
}
export function deserializeAssignmentStatisticDto(json: string): AssignmentStatisticDto {
  const data = JSON.parse(json) as AssignmentStatisticDto;
  initAssignmentStatisticDto(data);
  return data;
}
export function initAssignmentStatisticDto(_data: AssignmentStatisticDto) {
    return _data;
}
export function serializeAssignmentStatisticDto(_data: AssignmentStatisticDto | undefined) {
  if (_data) {
    _data = prepareSerializeAssignmentStatisticDto(_data as AssignmentStatisticDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeAssignmentStatisticDto(_data: AssignmentStatisticDto): AssignmentStatisticDto {
  const data: Record<string, any> = { ..._data };
  return data as AssignmentStatisticDto;
}
export interface CreatePublicationDto  {
  content: string;
  targetUsersIds: string[] | null;
  attachments: Attachment[] | null;
}
export function deserializeCreatePublicationDto(json: string): CreatePublicationDto {
  const data = JSON.parse(json) as CreatePublicationDto;
  initCreatePublicationDto(data);
  return data;
}
export function initCreatePublicationDto(_data: CreatePublicationDto) {
  if (_data) {
    _data.targetUsersIds = _data["targetUsersIds"];
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initAttachment(item)
      );
    }
  }
  return _data;
}
export function serializeCreatePublicationDto(_data: CreatePublicationDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreatePublicationDto(_data as CreatePublicationDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreatePublicationDto(_data: CreatePublicationDto): CreatePublicationDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeAttachment(item)
    );
  }
  return data as CreatePublicationDto;
}
export interface CreateAssignmentDto extends CreatePublicationDto  {
  payload: AssignmentPayload;
}
export function deserializeCreateAssignmentDto(json: string): CreateAssignmentDto {
  const data = JSON.parse(json) as CreateAssignmentDto;
  initCreateAssignmentDto(data);
  return data;
}
export function initCreateAssignmentDto(_data: CreateAssignmentDto) {
  initCreatePublicationDto(_data);
  if (_data) {
    _data.payload = _data["payload"] && initAssignmentPayload(_data["payload"]);
  }
  return _data;
}
export function serializeCreateAssignmentDto(_data: CreateAssignmentDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateAssignmentDto(_data as CreateAssignmentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateAssignmentDto(_data: CreateAssignmentDto): CreateAssignmentDto {
  const data = prepareSerializeCreatePublicationDto(_data as CreateAssignmentDto) as Record<string, any>;
  data["payload"] = _data.payload && prepareSerializeAssignmentPayload(_data.payload);
  return data as CreateAssignmentDto;
}
/** The base DTO for Publication patching. */
export interface PatchPublicationDto  {
  content?: string;
  attachments?: Attachment[] | null;
  targetUsersIds?: string[] | null;
}
export function deserializePatchPublicationDto(json: string): PatchPublicationDto {
  const data = JSON.parse(json) as PatchPublicationDto;
  initPatchPublicationDto(data);
  return data;
}
export function initPatchPublicationDto(_data: PatchPublicationDto) {
  if (_data) {
    if (Array.isArray(_data["attachments"])) {
      _data.attachments = _data["attachments"].map(item => 
        initAttachment(item)
      );
    }
    _data.targetUsersIds = _data["targetUsersIds"];
  }
  return _data;
}
export function serializePatchPublicationDto(_data: PatchPublicationDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchPublicationDto(_data as PatchPublicationDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchPublicationDto(_data: PatchPublicationDto): PatchPublicationDto {
  const data: Record<string, any> = { ..._data };
  if (Array.isArray(_data.attachments)) {
    data["attachments"] = _data.attachments.map(item => 
        prepareSerializeAttachment(item)
    );
  }
  return data as PatchPublicationDto;
}
export interface PatchAssignmentDto extends PatchPublicationDto  {
  payload?: PatchAssignmentPayloadDto;
}
export function deserializePatchAssignmentDto(json: string): PatchAssignmentDto {
  const data = JSON.parse(json) as PatchAssignmentDto;
  initPatchAssignmentDto(data);
  return data;
}
export function initPatchAssignmentDto(_data: PatchAssignmentDto) {
  initPatchPublicationDto(_data);
  if (_data) {
    _data.payload = _data["payload"] && initPatchAssignmentPayloadDto(_data["payload"]);
  }
  return _data;
}
export function serializePatchAssignmentDto(_data: PatchAssignmentDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchAssignmentDto(_data as PatchAssignmentDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchAssignmentDto(_data: PatchAssignmentDto): PatchAssignmentDto {
  const data = prepareSerializePatchPublicationDto(_data as PatchAssignmentDto) as Record<string, any>;
  data["payload"] = _data.payload && prepareSerializePatchAssignmentPayloadDto(_data.payload);
  return data as PatchAssignmentDto;
}
export interface PatchAssignmentPayloadDto  {
  title?: string;
  deadlineUtc?: Date | null;
}
export function deserializePatchAssignmentPayloadDto(json: string): PatchAssignmentPayloadDto {
  const data = JSON.parse(json) as PatchAssignmentPayloadDto;
  initPatchAssignmentPayloadDto(data);
  return data;
}
export function initPatchAssignmentPayloadDto(_data: PatchAssignmentPayloadDto) {
  if (_data) {
    _data.deadlineUtc = _data["deadlineUtc"] ? new Date(_data["deadlineUtc"].toString()) : <any>null;
  }
  return _data;
}
export function serializePatchAssignmentPayloadDto(_data: PatchAssignmentPayloadDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchAssignmentPayloadDto(_data as PatchAssignmentPayloadDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchAssignmentPayloadDto(_data: PatchAssignmentPayloadDto): PatchAssignmentPayloadDto {
  const data: Record<string, any> = { ..._data };
  data["deadlineUtc"] = _data.deadlineUtc && _data.deadlineUtc.toISOString();
  return data as PatchAssignmentPayloadDto;
}
export interface CreateAnnouncementDto extends CreatePublicationDto  {
  payload: AnnouncementPayload;
}
export function deserializeCreateAnnouncementDto(json: string): CreateAnnouncementDto {
  const data = JSON.parse(json) as CreateAnnouncementDto;
  initCreateAnnouncementDto(data);
  return data;
}
export function initCreateAnnouncementDto(_data: CreateAnnouncementDto) {
  initCreatePublicationDto(_data);
  if (_data) {
    _data.payload = _data["payload"] && initAnnouncementPayload(_data["payload"]);
  }
  return _data;
}
export function serializeCreateAnnouncementDto(_data: CreateAnnouncementDto | undefined) {
  if (_data) {
    _data = prepareSerializeCreateAnnouncementDto(_data as CreateAnnouncementDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializeCreateAnnouncementDto(_data: CreateAnnouncementDto): CreateAnnouncementDto {
  const data = prepareSerializeCreatePublicationDto(_data as CreateAnnouncementDto) as Record<string, any>;
  data["payload"] = _data.payload && prepareSerializeAnnouncementPayload(_data.payload);
  return data as CreateAnnouncementDto;
}
export interface PatchAnnouncementDto extends PatchPublicationDto  {
  payload?: PatchAnnouncementPayloadDto | null;
}
export function deserializePatchAnnouncementDto(json: string): PatchAnnouncementDto {
  const data = JSON.parse(json) as PatchAnnouncementDto;
  initPatchAnnouncementDto(data);
  return data;
}
export function initPatchAnnouncementDto(_data: PatchAnnouncementDto) {
  initPatchPublicationDto(_data);
  if (_data) {
    _data.payload = _data["payload"] && initPatchAnnouncementPayloadDto(_data["payload"]);
  }
  return _data;
}
export function serializePatchAnnouncementDto(_data: PatchAnnouncementDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchAnnouncementDto(_data as PatchAnnouncementDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchAnnouncementDto(_data: PatchAnnouncementDto): PatchAnnouncementDto {
  const data = prepareSerializePatchPublicationDto(_data as PatchAnnouncementDto) as Record<string, any>;
  data["payload"] = _data.payload && prepareSerializePatchAnnouncementPayloadDto(_data.payload);
  return data as PatchAnnouncementDto;
}
export interface PatchAnnouncementPayloadDto  {
}
export function deserializePatchAnnouncementPayloadDto(json: string): PatchAnnouncementPayloadDto {
  const data = JSON.parse(json) as PatchAnnouncementPayloadDto;
  initPatchAnnouncementPayloadDto(data);
  return data;
}
export function initPatchAnnouncementPayloadDto(_data: PatchAnnouncementPayloadDto) {
  return _data;
}
export function serializePatchAnnouncementPayloadDto(_data: PatchAnnouncementPayloadDto | undefined) {
  if (_data) {
    _data = prepareSerializePatchAnnouncementPayloadDto(_data as PatchAnnouncementPayloadDto);
  }
  return JSON.stringify(_data);
}
export function prepareSerializePatchAnnouncementPayloadDto(_data: PatchAnnouncementPayloadDto): PatchAnnouncementPayloadDto {
  const data: Record<string, any> = { ..._data };
  return data as PatchAnnouncementPayloadDto;
}
import type { AxiosError } from 'axios'
export interface FileParameter {
    data: any;
    fileName: string;
}
export interface FileResponse {
    data: Blob;
    status: number;
    fileName?: string;
    headers?: { [name: string]: any };
}
export class ApiException extends Error {
    message: string;
    status: number;
    response: string;
    headers: { [key: string]: any; };
    result: any;
    constructor(message: string, status: number, response: string, headers: { [key: string]: any; }, result: any) {
        super();
        this.message = message;
        this.status = status;
        this.response = response;
        this.headers = headers;
        this.result = result;
    }
    protected isApiException = true;
    static isApiException(obj: any): obj is ApiException {
        return obj.isApiException === true;
    }
}
export function throwException(message: string, status: number, response: string, headers: { [key: string]: any; }, result?: any): any {
    if (result !== null && result !== undefined)
        throw result;
    else
        throw new ApiException(message, status, response, headers, null);
}
export function isAxiosError(obj: any | undefined): obj is AxiosError {
    return obj && obj.isAxiosError === true;
}
//-----/Types.File-----